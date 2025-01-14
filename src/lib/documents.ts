type Document = {
    id: string
    name: string
    url: string
  }
  
  let documents: Document[] = [
    { id: '1', name: 'Sample Document', url: '/sample.pdf' },
  ]
  
  export async function getDocuments(): Promise<Document[]> {
    // In a real application, you would fetch this from a database
    return documents
  }
  
  export async function addDocument(file: File): Promise<Document> {
    // In a real application, you would upload the file to a storage service
    // and save the metadata to a database
    const newDocument: Document = {
      id: String(documents.length + 1),
      name: file.name,
      url: `/uploads/${file.name}`, // This is a placeholder URL
    }
  
    documents.push(newDocument)
    return newDocument
  }
  
  