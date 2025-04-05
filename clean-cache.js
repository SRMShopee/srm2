const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Function to check if directory exists
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Function to wait for a specified time
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to attempt cleaning with retries
async function cleanWithRetry(command, maxRetries = 5, delayMs = 1000) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1}: Running ${command}`);

      // Execute the command
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);

          // Consider it a success even if there's an error, we'll check the result after
          resolve();
        });
      });

      // For .next directory, check if it's gone or empty
      if (command.includes(".next") && !directoryExists(".next")) {
        console.log("Successfully cleaned .next directory!");
        return true;
      }

      // For node_modules/.cache, check if it's gone or empty
      if (
        command.includes("node_modules/.cache") &&
        !directoryExists("node_modules/.cache")
      ) {
        console.log("Successfully cleaned node_modules/.cache directory!");
        return true;
      }

      // If we're here, the command didn't fully succeed
      console.log(
        `Directory still exists after attempt ${attempts + 1}, retrying after delay...`,
      );
      await wait(delayMs);
      attempts++;
    } catch (error) {
      console.error(`Error during attempt ${attempts + 1}:`, error);
      await wait(delayMs);
      attempts++;
    }
  }

  console.log(
    `Failed to clean after ${maxRetries} attempts. You may need to restart your computer or manually delete the directories.`,
  );
  return false;
}

// Main function to clean Next.js cache
async function cleanNextCache() {
  console.log("Starting Next.js cache cleaning process...");

  // Kill any running Next.js processes first
  if (process.platform === "win32") {
    await cleanWithRetry("taskkill /f /im node.exe", 1, 0);
  } else {
    await cleanWithRetry('pkill -f "next dev"', 1, 0);
  }

  // Wait a bit for processes to fully terminate
  await wait(2000);

  // Clean .next directory
  const nextCleaned = await cleanWithRetry(
    process.platform === "win32" ? "npx rimraf .next" : "rm -rf .next",
    5,
    2000,
  );

  // Clean node_modules/.cache directory
  const cacheCleaned = await cleanWithRetry(
    process.platform === "win32"
      ? "npx rimraf node_modules/.cache"
      : "rm -rf node_modules/.cache",
    3,
    1000,
  );

  if (nextCleaned && cacheCleaned) {
    console.log("\n✅ Cache cleaning completed successfully!");
    console.log(
      "You can now restart your development server with: npm run dev",
    );
  } else {
    console.log("\n⚠️ Cache cleaning completed with some issues.");
    console.log(
      "Try restarting your computer before running the development server again.",
    );
  }
}

// Run the main function
cleanNextCache().catch((error) => {
  console.error("Unexpected error during cache cleaning:", error);
  process.exit(1);
});
