const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function splitImage(inputPath, outputDir) {
  try {
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    const quadrantWidth = Math.floor(width / 2);
    const quadrantHeight = Math.floor(height / 2);
    const filename = path.basename(inputPath, path.extname(inputPath));
    const extension = path.extname(inputPath);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const left = col * quadrantWidth;
        const top = row * quadrantHeight;

        const outputPath = path.join(
          outputDir,
          `${filename}_${row + 1}${col + 1}${extension}`
        );

        if (fs.existsSync(outputPath)) continue;

        await sharp(inputPath)
          .extract({
            left: left,
            top: top,
            width: quadrantWidth,
            height: quadrantHeight,
          })
          .toFile(outputPath);
      }
    }

    return true; // Success
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
    return false; // Failure
  }
}

async function processAllImages() {
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rawDir = path.join(__dirname, "raw");
  const files = fs.readdirSync(rawDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".tiff"].includes(ext);
  });

  if (files.length === 0) {
    console.log("No images found in the raw folder");
    return;
  }

  console.log(`Found ${files.length} image(s) to process...`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const inputPath = path.join(rawDir, file);
    const filename = path.basename(file, path.extname(file));
    const extension = path.extname(file);
    const allOutputsExist = [1, 2].every((row) =>
      [1, 2].every((col) =>
        fs.existsSync(
          path.join(outputDir, `${filename}_${row}${col}${extension}`)
        )
      )
    );

    if (allOutputsExist) {
      skippedCount++;
      continue;
    }

    const success = await splitImage(inputPath, outputDir);
    if (success) processedCount++;
  }

  console.log(
    `Done, processed ${processedCount} file(s), skipped ${skippedCount} already processed file(s)`
  );
}

// Start processing
processAllImages();
