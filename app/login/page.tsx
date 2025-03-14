import {signIn} from "@/auth";

export default function Login() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-gray-100 dark:from-background dark:to-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Ingresa con tu cuenta de Google</p>
                </div>

                <form
                    action={async () => {
                        "use server";
                        await signIn("google", {redirectTo: "/"});
                    }}
                    className="mt-8 space-y-6"
                >
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                    className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
              </span>
                            Iniciar con Google
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}