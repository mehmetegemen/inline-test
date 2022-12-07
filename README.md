# Inline Test
I like that in Rust we write unit tests in the same file with the code. This is a PoC of bringing that to Typescript. To have a sense of how it's like, in the root directory of this project:

- `npm install`
- `npm run build`
- `npm run test`

do these respectively. I just wanted to show the logic of how Rust-like unit tests would be done in Typescript, if you liked the project my LinkedIn is on my bio so you can send me a message from there. Then I can know whether idea is validated and I should continue.

# How it works

When you create an exported function named `unitTests` in the code file you work on, this library copies that file to tmp, add a function caller at the end of the file, and creates symlinks in your `src` directory until they are unlinked at the end of execution. All temporary tests go into `/tmp`. Then these tests are executed by Jest runner.