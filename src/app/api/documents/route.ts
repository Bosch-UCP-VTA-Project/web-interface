import { NextResponse } from 'next/server'
import { addDocument, getDocuments } from '@/lib/documents'

export async function GET() {
  const documents = await getDocuments()
  return NextResponse.json(documents)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 })
  }

  try {
    const document = await addDocument(file)
    return NextResponse.json(document)
  } catch (error) {
    console.error('Error uploading document:', error)
    return new NextResponse('Error uploading document', { status: 500 })
  }
}

