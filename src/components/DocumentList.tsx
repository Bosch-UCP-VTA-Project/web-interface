import { getDocuments } from '../lib/documents'
import { Button } from "@/components/ui/button"

export default async function DocumentList() {
  const documents = await getDocuments()

  return (
    <ul className="space-y-4">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
          <span className="font-medium">{doc.name}</span>
          <Button asChild variant="outline" size="sm">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          </Button>
        </li>
      ))}
    </ul>
  )
}

