import {embed, prompt} from "@/services/ia";

export default async function Search() {
    const answer = prompt("De que color es el cielo? dame una respuesta corta.")
    //const answer = embed("escribe la palabra hola")
    return <p>{answer}</p>;
}