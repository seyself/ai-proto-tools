"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommitMessage = generateCommitMessage;
exports.commit = commit;
exports.push = push;
exports.discardChanges = discardChanges;
exports.switchBranch = switchBranch;
exports.getCurrentBranchName = getCurrentBranchName;
exports.mergeBranch = mergeBranch;
exports.diff = diff;
exports.gitTest = gitTest;
const child_process_1 = require("child_process");
const ChatHelper_js_1 = __importDefault(require("../core/helpers/ChatHelper.js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const COMMIT_MESSAGE_MODEL = process.env.COMMIT_MESSAGE_MODEL || 'gpt-4o-mini';
const COMMIT_MESSAGE_LANG = process.env.COMMIT_MESSAGE_LANG || 'English';
/**
 * Asynchronous function to generate a commit message.
 * This function automatically creates an appropriate commit message based on current changes.
 * Specifically, it executes the `git diff` command to get file differences,
 * passes them to AI, and generates a commit message.
 * The generated message is returned in a format that can be used with the `git commit -m` command.
 *
 * @returns {Promise<string>} The generated commit message string.
 * @throws {Error} Throws an error if there's no response from AI or if commit message generation fails.
 * @remarks This function assists in automating commit message generation in version control.
 *          If the response fails, developers need to create commit messages manually.
 */
async function generateCommitMessage() {
    try {
        const diffSummary = (0, child_process_1.execSync)('git diff').toString();
        const agent = ChatHelper_js_1.default.create({
            systemPrompt: 'Please create a commit message for the following updates.',
            model: COMMIT_MESSAGE_MODEL,
        });
        const prompt = `Please generate a concise commit message that indicates which part of the code and what specific processing has been modified for the following update.
Output the message in the specified JSON format.
The commit message should be output in ${COMMIT_MESSAGE_LANG}.

## JSON Format
{
  "commitCommand": "git commit -m \"commit message\""
  "commitMessage": "commit message"
}

---

\`\`\`
${diffSummary}
\`\`\`
`;
        //
        console.log(prompt);
        const response = await agent.send(prompt, { json: true });
        if (!response) {
            throw new Error('Failed to get commit message.');
        }
        return response.commitMessage;
    }
    catch (error) {
        console.error('Diff generation error:', error);
        throw new Error('An error occurred while getting the diff. Changes might be too large.');
    }
}
/**
 * Function to commit changes.
 * This function generates a commit message based on current changes and commits the changes to Git.
 * Specifically, it first calls the "generateCommitMessage" function to get the commit message,
 * then uses the obtained message to generate a Git commit command,
 * and finally executes the commit command.
 *
 * @returns {Promise<void>} This function does not return a value and runs asynchronously.
 * @throws {Error} Throws an error if there's an error generating the commit message or committing the changes.
 * @remarks This function is important for recording change history and understanding Git history.
 *          Callers can use this function to manage Git changes.
 */
async function commit() {
    const commitMessage = await generateCommitMessage();
    if (commitMessage) {
        const cmd = `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`;
        console.log('commit: >>>>', cmd);
        (0, child_process_1.execSync)(`git add .`);
        (0, child_process_1.execSync)(cmd);
    }
}
/**
 * Function to push local changes to the remote repository.
 * This function pushes local changes to the remote repository,
 * allowing other developers to see the changes.
 *
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error pushing the changes.
 */
function push() {
    (0, child_process_1.execSync)('git push');
}
/**
 * Function to discard changes and revert to the latest commit state.
 * This function discards all uncommitted changes and untracked files,
 * and reverts the working directory to the latest commit state.
 *
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error discarding changes.
 */
function discardChanges() {
    try {
        (0, child_process_1.execSync)('git reset --hard HEAD');
        console.log('Changes discarded and reverted to the latest commit state.');
        (0, child_process_1.execSync)('git clean -fd');
        console.log('All untracked files have been removed.');
    }
    catch (error) {
        console.error('Error occurred while discarding changes:', error);
    }
}
/**
 * Function to switch to a specified branch.
 * This function switches to a specified branch if it exists,
 * or creates a new branch and switches to it if it doesn't exist.
 *
 * @param {string} branchName - The name of the branch to switch to or create.
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error switching branches.
 */
function switchBranch(branchName) {
    try {
        (0, child_process_1.execSync)(`git checkout ${branchName}`);
        console.log(`Switched to branch '${branchName}'.`);
    }
    catch (error) {
        console.log(`Branch '${branchName}' does not exist. Creating and switching to new branch.`);
        (0, child_process_1.execSync)(`git checkout -b ${branchName}`);
        console.log(`Created and switched to new branch '${branchName}'.`);
    }
}
/**
 * Function to get the current Git branch name.
 * This function gets the current branch name of the working directory.
 * If the branch name cannot be retrieved, it throws an error.
 *
 * @returns {string} The current branch name.
 * @throws {Error} Throws an error if the current branch name cannot be retrieved.
 */
function getCurrentBranchName() {
    try {
        const branchName = (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD').toString().trim();
        console.log(`Current branch name is '${branchName}'.`);
        return branchName;
    }
    catch (error) {
        console.error('Error occurred while getting current branch name:', error);
        throw new Error('Failed to get current branch name.');
    }
}
/**
 * Function to merge a specified branch into the current branch.
 * This function merges a specified branch into the current branch.
 * If the specified branch does not exist or the current branch does not exist,
 * an error message is displayed.
 *
 * @param {string} fromBranch - The name of the branch to merge from (default is 'main').
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error merging branches.
 */
function mergeBranch(fromBranch, toBranch = 'main') {
    try {
        (0, child_process_1.execSync)(`git checkout ${toBranch}`);
        console.log(`Switched to branch '${toBranch}'.`);
        (0, child_process_1.execSync)(`git merge ${fromBranch}`);
        console.log(`Merged branch '${fromBranch}' into ${toBranch} branch.`);
    }
    catch (error) {
        console.error(`Error occurred while merging branch '${fromBranch}' into ${toBranch} branch:`, error);
    }
}
/**
 * Function to get a list of changed files and their differences.
 * This function gets a list of changed files and their differences in the current Git repository.
 * The list is returned in an array format, where each element is an object containing the file path,
 * file name, and difference content.
 *
 * @returns {any[]} An array of objects containing information about changed files.
 * @throws {Error} Throws an error if there's an error getting the list of changed files.
 *    If an error occurs, the reason is printed to the console.
 */
function diff() {
    try {
        const diffString = (0, child_process_1.execSync)('git diff --name-only').toString();
        const diffFiles = diffString
            .trim()
            .split('\n')
            .map((filePath) => {
            const fileName = filePath.split('/').pop();
            const diffContent = (0, child_process_1.execSync)(`git diff ${filePath}`).toString();
            return {
                filePath,
                fileName,
                diffContent,
            };
        });
        console.log('Retrieved list of changed files');
        return diffFiles;
    }
    catch (error) {
        console.error('Error occurred while getting list of changed files:', error);
        throw new Error('Failed to get list of changed files.');
    }
}
/**
 * gitTest function is an asynchronous function to test Git operations.
 * This function uses commented-out code to demonstrate various Git operations.
 * It also retrieves information about file differences and displays it in JSON format.
 *
 * @returns {Promise<void>} This function does not return a value and runs asynchronously.
 * @remarks This function demonstrates the use of various Git operations,
 *          such as commit processing, branch switching, and merging.
 *          It allows developers to check the state of branches and understand changes.
 */
async function gitTest() {
    // await commit();
    // console.log(getCurrentBranchName());
    // switchBranch('feature/test');
    // const branchName = getCurrentBranchName();
    // mergeBranch(branchName, 'main');
    console.log(JSON.stringify(diff(), null, 2));
}
