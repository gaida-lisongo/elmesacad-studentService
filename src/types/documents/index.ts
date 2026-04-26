
type PdfDocumentInfo = {
    title: string;
    author?: string;
    subject?: string;
    keywords?: string;
};
export type PdfDocumentDefinition = {
    info?: PdfDocumentInfo;
    content?: unknown[];
    pageSize?: string;
    pageMargins?: [number, number, number, number];
    defaultStyle?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    [key: string]: unknown;
};