import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const filePath = join(process.cwd(), "truck.glb");
  const [file, fileInfo] = await Promise.all([readFile(filePath), stat(filePath)]);

  return new Response(file, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": fileInfo.size.toString(),
      "Content-Type": "model/gltf-binary",
    },
  });
}

