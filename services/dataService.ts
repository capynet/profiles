import {Prisma, Profile} from "@prisma/client";
import {prisma} from "@/prisma";

export const DataService = {
    async getAllLanguages() {
        try {
            return await prisma.language.findMany({
                select: {id: true, name: true}
            });
        } catch (error) {
            console.error('Error fetching languages:', error);
            return [];
        }
    },

    async getAllPaymentMethods() {
        try {
            return await prisma.paymentMethod.findMany({
                select: {id: true, name: true}
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
            return await prisma.profile.create({
                data: {
                    ...data,
                    paymentMethods: {
                        create: data.paymentMethods?.connect?.map(id => ({paymentMethodId: id})) || []
                    },
                    languages: {
                        create: data.languages?.connect?.map(id => ({languageId: id})) || []
                    }
                },
                include: {
                    paymentMethods: true,
                    languages: true
                }
            });
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error('Failed to create profile');
        }
    },

    async updateProfile(profileId: number, data: Prisma.ProfileUpdateInput) {
        try {
            return await prisma.$transaction([
                prisma.profile.update({
                    where: {id: profileId},
                    data
                }),
                prisma.profilePaymentMethod.deleteMany({where: {profileId}}),
                prisma.profileLanguage.deleteMany({where: {profileId}}),
                prisma.profilePaymentMethod.createMany({
                    data: (data.paymentMethods?.connect || []).map((id: number) => ({
                        profileId,
                        paymentMethodId: id
                    }))
                }),
                prisma.profileLanguage.createMany({
                    data: (data.languages?.connect || []).map((id: number) => ({
                        profileId,
                        languageId: id
                    }))
                })
            ]);
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