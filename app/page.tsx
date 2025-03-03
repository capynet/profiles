import Link from "next/link";
import {auth, signOut} from "@/auth";

export default async function Home() {
    const session = await auth();

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                {session && session.user ? (
                    <>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <h1 className="text-4xl font-bold">Bienvenido {session.user.name}</h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                                Has iniciado sesión como {session.user.email}
                            </p>

                            {session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt="Profile Picture"
                                    className="w-24 h-24 rounded-full border-4 border-blue-500 mt-2"
                                />
                            )}

                            <form
                                action={async () => {
                                    "use server";
                                    await signOut({redirectTo: "/"});
                                }}
                                className="mt-4"
                            >
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Cerrar sesión
                                </button>
                            </form>
                        </div>

                        <Link href="/profile/edit"> Profile </Link>

                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold">Bienvenido a la aplicación</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Esta es la página principal de la aplicación
                        </p>
                        <Link
                            href="/login"
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Ir a iniciar sesión
                        </Link>
                    </>
                )}
            </main>
        </div>
    );
}