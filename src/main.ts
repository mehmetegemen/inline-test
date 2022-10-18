import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, default as fs } from "fs";
import { run } from "jest";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED_DESCRIPTOR_CHARS = ["0", "1", "2", "3", "4" ,"5" ,"6", "7", "8", "9", "A",
    "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R",
    "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i",
    "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "."] as const;

const TMP_FOLDER = "./.inlinetest";

type Dir = "." | ".." | `/${typeof ALLOWED_DESCRIPTOR_CHARS[number]}`;
// Adding a message with never informs the user when they get curious about the error and dive deep into code
type Path3<T, O> = T extends `${Dir}${infer U}` ? Path2<U, O> : T extends "" ? O : "Path is not valid" & never;
type Path2<T, O> = T extends `${Dir}${infer U}` ? Path3<U, O> : T extends "" ? O : "Path is not valid" & never;
type Path<T> = Path2<T, T>;

type UnitTestFunction = () => void;

interface ModuleMayHaveUnitTests {
    unitTests?: () => void;
}

const getFilePaths = (dir: string): string[] => {
    const listOfFileDescriptors = readdirSync(path.join(__dirname, dir), { withFileTypes: true });
    const codeFiles = [];
    for (const descriptor of listOfFileDescriptors) {
        if (descriptor.isFile() && [".js", ".ts"].includes(path.extname(descriptor.name))) {
            codeFiles.push(path.join(__dirname, dir, descriptor.name));
        }

        if (descriptor.isDirectory()) {
            const files = getFilePaths(dir + "/" + descriptor.name);
            codeFiles.push(...files);
        }
    }

    return codeFiles;
};

const getUnitTests = (module: ModuleMayHaveUnitTests): UnitTestFunction | undefined => {
    if (module?.unitTests) {
        return module?.unitTests;
    }
};

const createTemporaryFile = (filePath: string) => {
    let file = readFileSync(filePath).toString();
    file += "\nunitTests();";
    mkdirSync(TMP_FOLDER, { recursive: true });
    const newFilePath = `${TMP_FOLDER}/${randomBytes(6).toString("hex")}.test.js`;
    writeFileSync(newFilePath, file, { flag: "w+" });
    return newFilePath;
};

export const main = async <T>(mainPath: Path<T>) => {
    if (typeof mainPath !== "string") {
        throw new Error("Provided tests path is not a string.");
    }

    try {
        const codeFilePaths = getFilePaths(mainPath);
        for (const filePath of codeFilePaths) {
            const codeFileWithTest = await import(filePath);
            const unitTests = getUnitTests(codeFileWithTest);
            if (unitTests) {
                createTemporaryFile(filePath);
            }
        }
        await run();
    } finally {
        rmSync(".inlinetest");
    }
};

console.log(this);

// ~Tests
export const unitTests = () => {
    describe("InlineTest tests", () => {
        describe("getFilePaths", () => {
            it("should return file paths successfuly", () => {
                jest.spyOn(fs, "readdirSync");
                jest.spyOn(fs.Dirent.prototype, "isFile").mockImplementation(() => true);
                jest.spyOn(fs, "readdirSync");
                jest.spyOn(fs, "readdirSync");
                expect(() => getFilePaths("./src/code.js")).toBeTruthy();
            });
        });
    });
};