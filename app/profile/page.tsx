import Link from 'next/link';
import {redirect} from 'next/navigation';
import {auth} from '@/auth';
import {DataService} from '@/services/dataService';

export const metadata = {
    title: 'Mi Perfil',
    description: 'Visualiza y gestiona tu perfil profesional',
};

export default async function ProfilePage() {
    const session = await auth();

    // Verificar si el usuario está autenticado
    if (!session) {
        redirect('/login');
    }

    // Obtener perfil del usuario actual
    const profiles = await DataService.getProfiles({userId: session.user?.id});
    const profile = profiles[0];

    if (!profile) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">No tienes un perfil creado</h1>
                    <p className="mb-6">Crea tu perfil para comenzar a ofrecer tus servicios.</p>
                    <Link href="/profile/create" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                        Crear Perfil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="md:flex">
                    <div className="md:flex-shrink-0">
                        {profile.image ? (
                            <img
                                className="h-48 w-full object-cover md:w-48"
                                src={profile.image}
                                alt={profile.name}
                            />
                        ) : (
                            <div className="h-48 w-full md:w-48 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">Sin imagen</span>
                            </div>
                        )}
                    </div>
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">{profile.name}</h1>
                                <p className="text-sm text-gray-500">{profile.age} años</p>
                            </div>
                            <div className="text-xl font-bold text-green-600">
                                ${profile.price.toFixed(2)}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-lg font-semibold">Descripción</h2>
                            <p className="mt-2 text-gray-600">{profile.description}</p>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-lg font-semibold">Ubicación</h2>
                            <p className="mt-2 text-gray-600">{profile.address}</p>
                            <div className="mt-1 text-sm text-gray-500">
                                Lat: {profile.latitude}, Long: {profile.longitude}
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">Métodos de Pago</h2>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {profile.paymentMethods.map(({paymentMethod}) => (
                                        <span
                                            key={paymentMethod.id}
                                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                        >
                      {paymentMethod.name}
                    </span>
                                    ))}
                                    {profile.paymentMethods.length === 0 && (
                                        <span className="text-gray-500">No hay métodos de pago registrados</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold">Idiomas</h2>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {profile.languages.map(({language}) => (
                                        <span
                                            key={language.id}
                                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                                        >
                      {language.name}
                    </span>
                                    ))}
                                    {profile.languages.length === 0 && (
                                        <span className="text-gray-500">No hay idiomas registrados</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Link
                                href={`/profile/edit/${profile.id}`}
                                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Editar Perfil
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}