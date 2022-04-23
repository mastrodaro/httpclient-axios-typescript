import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  moduleFileExtensions: ["ts", "js"],
  rootDir: "",
  testRegex: ".*\\.test\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/*.ts"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
};

export default config;
