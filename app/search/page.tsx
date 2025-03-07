import {indexDocumentForRAG} from "@/services/ia";


export default async function Search() {
    const documentText = "Este es un documento largo que necesitamos procesar para RAG...";
    indexDocumentForRAG(documentText, {title: "Documento de ejemplo", source: "wiki", author: "Usuario123"});


    return <p>No devuelve nada visible. Solo indexa</p>;
}