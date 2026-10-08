// Los tipos de las imágenes importadas (`import foto from "@/public/…webp"`).
// Los trae next-env.d.ts, pero ese archivo está ignorado y lo genera `next dev`:
// en el CI los tipos corren antes del build, sin él, y la portada no compilaba.
/// <reference types="next/image-types/global" />
