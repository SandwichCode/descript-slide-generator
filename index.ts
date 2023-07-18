// INSTRUCTIONS
// 1. Put script in scripts/{name}.(md|txt)
// 2. Set SCRIPT below
// 3. ▶️ Run

// CONFIG //
const SCRIPT = "freshflavors.md"
const LINES = 10
const MODEL = "gpt-4" // gpt-3.5-turbo | gpt-4
const TEMPERATURE = 0.1
const OUTPUT = `./output/${SCRIPT.split(".")[0]}.json`

import "dotenv/config"
import { z } from "zod"
import { OpenAI } from "langchain/llms/openai"
import { PromptTemplate } from "langchain/prompts"
import { LLMChain } from "langchain/chains"
import * as fs from "fs"

import {
  OutputFixingParser,
  StructuredOutputParser,
} from "langchain/output_parsers"

const parser = StructuredOutputParser.fromZodSchema(
  z.array(
    z.object({
      topic: z
        .string()
        .describe(
          "1-3 word topic of the paragraph - like for a table of contents"
        ),
      importance: z.number().gte(0).lte(1).describe("How important this paragraph is in context of the transcript"),
      sentiment: z.string().describe("positive, negative, neutral"),
      tone: z
        .string()
        .describe(
          "Imagine if it was to be read - what tone would you use.  e.g. serious, playful, happy, excited, negative, etc."
        ),
      slide: z.object({
        title: z.string().describe("Title for this slide"),
        bullets: z.array(z.string()).describe("An array of 2-5 bullet points")
      }).describe("Info from paragraph that can be presented for presentation slide"),
    })).describe("An array of each paragraph")
)

const promptTemplate = new PromptTemplate({
  template: `
    Format the following transcript.
    - The transcript is an array
    - Each index is a different "scene"
    
    The transcript:
    {transcript}

    {format_instructions}
    
    Output:
  `,
  inputVariables: ["transcript", "format_instructions"],
  partialVariables: { format_instructions: parser.getFormatInstructions() },
})

export async function run(script: string) {
  const filename = script.split(".")[0]
  const transcript = fs.readFileSync(`./scripts/${script}`, { encoding: "utf-8" })
  const transcriptFormatted = transcript.split("\n\n").filter(p => p?.length > 0).slice(0, LINES)

  fs.writeFileSync(OUTPUT, "")

  console.log(`📖 Reading ${script}...`)

  const llm = new OpenAI({
    temperature: TEMPERATURE,
    modelName: MODEL,
    maxTokens: 2000,
    streaming: true,
  })

  const chain = new LLMChain({ llm, prompt: promptTemplate })
  const res = await chain.call({ transcript: transcriptFormatted }, [
    {
      handleLLMNewToken(token: string) {
        fs.appendFileSync(OUTPUT, token)
      },
    }
  ])

  let json
  try {
    json = await parser.parse(res.text)
  } catch (e) {
    console.log("catching error", e)
    const fixParser = OutputFixingParser.fromLLM(
      new OpenAI({ temperature: 0 }),
      parser
    )
    json = await fixParser.parse(res.text)
  }

  json = json.map((p, i) => ({ ...p, paragraph: transcriptFormatted[i] }))

  fs.writeFileSync(OUTPUT, JSON.stringify(json, null, 2))
  console.log(`✅ Written to output/${filename}.json`)
}

run(SCRIPT)
