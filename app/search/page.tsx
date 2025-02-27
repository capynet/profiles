import {prompt} from "@/services/ia";

export default async function Search() {
    const answer = prompt("De que color es el cielo? dame una respuesta corta.")
    return <p>{answer}</p>;
}