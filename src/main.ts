import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, linkSync, unlinkSync, default as fs, link } from "fs";
import { run } from "jest";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED_DESCRIPTOR_CHARS = ["0", "1", "2", "3", "4" ,"5" ,"6", "7", "8", "9", "A",
    "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R",
    "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i",
    "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "."] as const;

type Dir = "." | ".." | `/${typeof ALLOWED_DESCRIPTOR_CHARS[number]}`;
// Adding a message with never informs the user when they get curious about the error and dive deep into code
type Path3<T, O> = T extends `${Dir}${infer U}` ? Path2<U, O> : T extends "" ? O : "Path is not valid" & never;
type Path2<T, O> = T extends `${Dir}${infer U}` ? Path3<U, O> : T extends "" ? O : "Path is not valid" & never;
type Path<T> = Path2<T, T>;

type UnitTestFunction = () => void;

interface ModuleMayHaveUnitTests {
    unitTests?: () => void;
}

type FilePath = {
    dir: string;
    filePath: string;
}

const getFilePaths = (dir: string): FilePath[] => {
    const listOfFileDescriptors = readdirSync(path.join(__dirname, dir), { withFileTypes: true });
    const codeFiles = [];
    for (const descriptor of listOfFileDescriptors) {
        if (descriptor.isFile() && [".js", ".ts"].includes(path.extname(descriptor.name))) {
            codeFiles.push({
                dir: path.join(__dirname, dir),
                filePath: path.join(__dirname, dir, descriptor.name)
            });
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

const createTemporaryFile = (filePath: string, dir: string) => {
    let file = readFileSync(filePath).toString();
    file += "\nunitTests();";
    const filename = `${randomBytes(6).toString("hex")}_inline.test.ts`;
    const newFilePath = `/tmp/${filename}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(newFilePath, file);
    linkSync(newFilePath, dir + "/" + filename);
    return {
        newFilePath,
        filename,
        dir,
        file,
    };
};

export const main = async <T>(mainPath: Path<T>) => {
    if (typeof mainPath !== "string") {
        throw new Error("Provided tests path is not a string.");
    }

    const createdFiles = [];

    try {
        const codeFilePaths = getFilePaths(mainPath);
        for (const filePath of codeFilePaths) {
            const codeFileWithTest = await import(filePath.filePath);
            const unitTests = getUnitTests(codeFileWithTest);
            if (unitTests) {
                const createdFilePath = createTemporaryFile(filePath.filePath, filePath.dir);
                createdFiles.push(createdFilePath);
            }
        }
        await run();
    } finally {
        for (const { dir, filename } of createdFiles) {
            unlinkSync(path.join(dir, filename));
        }
    }
};

// ~Tests
export const unitTests = () => {
    describe("InlineTest tests", () => {
        describe("getFilePaths", () => {
            it("should return file paths successfuly in a flat directory", () => {
                jest.spyOn(fs, "readdirSync").mockImplementation(() => (
                    [
                        {
                            name: "examplecode.ts",
                            isFile: () => true,
                            isDirectory: () => false,
                        }
                    ] as any));
                expect(getFilePaths("./code.js")).toHaveLength(1);

                jest.clearAllMocks();
            });
        });
    });
};