import { access, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function resolveModelPath() {
  const preferredPath = join(process.cwd(), "truck_with_beam.glb");

  try {
    await access(preferredPath);
    return preferredPath;
  } catch {
    return join(process.cwd(), "truck.glb");
  }
}

export async function GET() {
  const filePath = await resolveModelPath();
  const [file, fileInfo] = await Promise.all([readFile(filePath), stat(filePath)]);

  return new Response(file, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Length": fileInfo.size.toString(),
      "Content-Type": "model/gltf-binary",
    },
  });
}
