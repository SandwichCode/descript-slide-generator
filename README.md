# Descript Transcription Slides

This script extracts presentation slides from a whisper transcript. 

## Usage

1. yarn install
2. set `OPENAI_API_KEY` in `.env`
3. configure any variables in `index.ts`
   * `SCRIPT`: which script from scripts/ directory to read
   * `LINES`: how many lines to process (good for debugging)
   * `MODEL`: `gpt-3.5-turbo` or `gpt-4`
   * `TEMPERATURE`: how much creativity to allow LLM
   * `OUTPUT`: what to name the json file
4. `ts-node-esm` index.ts
   