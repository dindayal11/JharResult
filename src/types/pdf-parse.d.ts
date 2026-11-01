declare module "pdf-parse" {
  interface PdfData { text: string; numpages: number; info?: unknown; metadata?: unknown; }
  function pdf(dataBuffer: Buffer): Promise<PdfData>;
  export default pdf;
}
