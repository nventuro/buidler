import { assert } from "chai";
import * as fsExtra from "fs-extra";
import * as path from "path";

import { getAllArtifacts } from "../../src/internal/artifacts";
import { ERRORS } from "../../src/internal/core/errors-list";
import { useEnvironment } from "../helpers/environment";
import { expectBuidlerErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

describe("run task", function () {
  useFixtureProject("project-with-scripts");
  useEnvironment();

  it("Should fail if a script doesn't exist", async function () {
    await expectBuidlerErrorAsync(
      () =>
        this.env.run("run", { script: "./does-not-exist", noCompile: true }),
      ERRORS.BUILTIN_TASKS.RUN_FILE_NOT_FOUND
    );
  });

  it("Should run the scripts to completion", async function () {
    await this.env.run("run", {
      script: "./async-script.js",
      noCompile: true,
    });

    assert.equal(process.exitCode, 0);
    (process as any).exitCode = undefined;
  });

  it("Should compile before running", async function () {
    if (await fsExtra.pathExists("cache")) {
      await fsExtra.remove("cache");
    }

    if (await fsExtra.pathExists("artifacts")) {
      await fsExtra.remove("artifacts");
    }

    await this.env.run("run", {
      script: "./successful-script.js",
    });
    assert.equal(process.exitCode, 0);
    (process as any).exitCode = undefined;

    const files = await getAllArtifacts(path.join(process.cwd(), "artifacts"));
    const expectedFiles = ["artifacts/contracts/a:A.json"].map((file) =>
      path.join(process.cwd(), file)
    );
    assert.sameMembers(files, expectedFiles);

    await fsExtra.remove("artifacts");
  });

  it("Shouldn't compile if asked not to", async function () {
    if (await fsExtra.pathExists("cache")) {
      await fsExtra.remove("cache");
    }

    if (await fsExtra.pathExists("artifacts")) {
      await fsExtra.remove("artifacts");
    }

    await this.env.run("run", {
      script: "./successful-script.js",
      noCompile: true,
    });
    assert.equal(process.exitCode, 0);
    (process as any).exitCode = undefined;

    assert.isFalse(await fsExtra.pathExists("artifacts"));
  });

  it("Should return the script's status code on success", async function () {
    await this.env.run("run", {
      script: "./successful-script.js",
      noCompile: true,
    });
    assert.equal(process.exitCode, 0);
    (process as any).exitCode = undefined;
  });

  it("Should return the script's status code on failure", async function () {
    await this.env.run("run", {
      script: "./failing-script.js",
      noCompile: true,
    });
    assert.notEqual(process.exitCode, 0);
    (process as any).exitCode = undefined;
  });
});
