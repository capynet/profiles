import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Get filter params
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const minAge = searchParams.get('minAge');
        const maxAge = searchParams.get('maxAge');
        const languages = searchParams.get('languages');
        const paymentMethods = searchParams.get('paymentMethods');

        // Build filter conditions
        const whereConditions: Prisma.ProfileWhereInput = {};

        // Price range filter
        if (minPrice || maxPrice) {
            whereConditions.price = {};
            if (minPrice) {
                whereConditions.price.gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                whereConditions.price.lte = parseFloat(maxPrice);
            }
        }

        // Age range filter
        if (minAge || maxAge) {
            whereConditions.age = {};
            if (minAge) {
                whereConditions.age.gte = parseInt(minAge);
            }
            if (maxAge) {
                whereConditions.age.lte = parseInt(maxAge);
            }
        }

        // Languages filter
        if (languages) {
            const languageIds = languages.split(',').map(Number);
            if (languageIds.length > 0) {
                whereConditions.languages = {
                    some: {
                        languageId: {
                            in: languageIds
                        }
                    }
                };
            }
        }

        // Payment methods filter
        if (paymentMethods) {
            const paymentMethodIds = paymentMethods.split(',').map(Number);
            if (paymentMethodIds.length > 0) {
                whereConditions.paymentMethods = {
                    some: {
                        paymentMethodId: {
                            in: paymentMethodIds
                        }
                    }
                };
            }
        }

        // Get profiles with filters
        const profiles = await DataService.getProfiles(whereConditions);

        return NextResponse.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}