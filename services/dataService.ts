import {Prisma, Profile} from "@prisma/client";
import {prisma} from "@/prisma";

export const DataService = {
    async getAllLanguages() {
        try {
            return await prisma.language.findMany({
                select: {id: true, name: true},
                orderBy: { name: 'asc' }
            });
        } catch (error) {
            console.error('Error fetching languages:', error);
            return [];
        }
    },

    async getAllPaymentMethods() {
        try {
            return await prisma.paymentMethod.findMany({
                select: {id: true, name: true},
                orderBy: { name: 'asc' }
            });
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
    },

    async getProfiles(where?: Prisma.ProfileWhereInput) {
        try {
            return await prisma.profile.findMany({
                where,
                include: {
                    languages: {include: {language: true}},
                    paymentMethods: {include: {paymentMethod: true}},
                    user: {select: {name: true, email: true}}
                }
            });
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    },

    async createProfile(data: Prisma.ProfileCreateInput) {
        try {
            // Extraer los IDs de languages y paymentMethods
            const languageConnections = data.languages?.connect || [];
            const paymentMethodConnections = data.paymentMethods?.connect || [];

            // Eliminar languages y paymentMethods para crear primero el perfil
            const { languages, paymentMethods, ...profileData } = data;

            // Crear el perfil
            const profile = await prisma.profile.create({
                data: profileData
            });

            // Crear relaciones para languages
            if (languageConnections.length > 0) {
                await prisma.profileLanguage.createMany({
                    data: languageConnections.map((connection: any) => ({
                        profileId: profile.id,
                        languageId: connection.id
                    }))
                });
            }

            // Crear relaciones para paymentMethods
            if (paymentMethodConnections.length > 0) {
                await prisma.profilePaymentMethod.createMany({
                    data: paymentMethodConnections.map((connection: any) => ({
                        profileId: profile.id,
                        paymentMethodId: connection.id
                    }))
                });
            }

            return profile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error('Failed to create profile');
        }
    },

    async updateProfile(profileId: number, data: Prisma.ProfileUpdateInput) {
        try {
            // Extraer los IDs de languages y paymentMethods
            const languageConnections = data.languages?.connect || [];
            const paymentMethodConnections = data.paymentMethods?.connect || [];

            // Eliminar languages y paymentMethods para actualizar primero el perfil
            const { languages, paymentMethods, ...profileData } = data;

            // Iniciar transacción
            return await prisma.$transaction(async (tx) => {
                // Actualizar el perfil
                await tx.profile.update({
                    where: { id: profileId },
                    data: profileData
                });

                // Eliminar relaciones existentes
                await tx.profileLanguage.deleteMany({
                    where: { profileId }
                });

                await tx.profilePaymentMethod.deleteMany({
                    where: { profileId }
                });

                // Crear nuevas relaciones para languages
                if (languageConnections.length > 0) {
                    await tx.profileLanguage.createMany({
                        data: languageConnections.map((connection: any) => ({
                            profileId,
                            languageId: connection.id
                        }))
                    });
                }

                // Crear nuevas relaciones para paymentMethods
                if (paymentMethodConnections.length > 0) {
                    await tx.profilePaymentMethod.createMany({
                        data: paymentMethodConnections.map((connection: any) => ({
                            profileId,
                            paymentMethodId: connection.id
                        }))
                    });
                }

                // Devolver el perfil actualizado
                return await tx.profile.findUnique({
                    where: { id: profileId },
                    include: {
                        languages: { include: { language: true } },
                        paymentMethods: { include: { paymentMethod: true } }
                    }
                });
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Failed to update profile');
        }
    },

    async getUsers() {
        try {
            return await prisma.user.findMany();
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
};