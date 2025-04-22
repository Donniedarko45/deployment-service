import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const app = express();
app.use(express.json());

// Add CORS headers
app.use((req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// match everything, no path‐to‐regexp parsing needed
app.use(async (req: any, res: any) => {
  try {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path === "/" ? "/index.html" : req.path;
    const Key = `dist/${id}${filePath}`.replace(/^\/+/, "");

    const command = new GetObjectCommand({
      Bucket: "devship",
      Key: Key,
    });

    const data = await s3Client.send(command);

    const type = filePath.endsWith(".html")
      ? "text/html"
      : filePath.endsWith(".css")
      ? "text/css"
      : filePath.endsWith(".js")
      ? "application/javascript"
      : "application/octet-stream";

    res.setHeader("Content-Type", type);

    // Stream the response body
    if (data.Body) {
      const stream = data.Body as any;
      stream.pipe(res);
    } else {
      res.status(404).send("File not found");
    }
  } catch (err: any) {
    console.error("Error serving file:", err);
    if (err.name === "NoSuchKey") {
      res.status(404).send("File not found");
    } else {
      res.status(500).send("Internal server error");
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
