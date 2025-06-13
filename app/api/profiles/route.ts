// app/api/profiles/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';
import {Prisma} from '@prisma/client';

export const revalidate = 300;

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

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
        const nationality = searchParams.get('nationality');
        const ethnicity = searchParams.get('ethnicity');
        const services = searchParams.get('services');
        
        // New location-based parameters
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = searchParams.get('radius');

        // Build filter conditions
        const whereConditions: Prisma.ProfileWhereInput = {
            // Only show published profiles in public API
            published: true,
        };

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
        
        // Nationality filter
        if (nationality) {
            const nationalityId = parseInt(nationality);
            if (!isNaN(nationalityId)) {
                whereConditions.nationalities = {
                    some: {
                        nationalityId: nationalityId
                    }
                };
            }
        }
        
        // Ethnicity filter
        if (ethnicity) {
            const ethnicityId = parseInt(ethnicity);
            if (!isNaN(ethnicityId)) {
                whereConditions.ethnicities = {
                    some: {
                        ethnicityId: ethnicityId
                    }
                };
            }
        }
        
        // Services filter
        if (services) {
            const serviceIds = services.split(',').map(Number);
            if (serviceIds.length > 0) {
                whereConditions.services = {
                    some: {
                        serviceId: {
                            in: serviceIds
                        }
                    }
                };
            }
        }

        // Get profiles with filters
        let profiles = await DataService.getProfiles(whereConditions);

        // Apply location-based filtering if parameters are provided
        // We do this post-query because Prisma doesn't support geospatial queries natively
        if (lat && lng && radius) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const maxDistance = parseFloat(radius);
            
            if (!isNaN(userLat) && !isNaN(userLng) && !isNaN(maxDistance)) {
                // Filter profiles by distance
                profiles = profiles.filter(profile => {
                    if (profile.latitude && profile.longitude) {
                        const distance = calculateDistance(
                            userLat, 
                            userLng, 
                            profile.latitude, 
                            profile.longitude
                        );
                        return distance <= maxDistance;
                    }
                    return false;
                });
                
                // Sort profiles by distance from the user
                profiles.sort((a, b) => {
                    const distanceA = calculateDistance(userLat, userLng, a.latitude, a.longitude);
                    const distanceB = calculateDistance(userLat, userLng, b.latitude, b.longitude);
                    return distanceA - distanceB;
                });
            }
        }

        const cacheKey = JSON.stringify({
            minPrice, maxPrice, minAge, maxAge, languages, paymentMethods,
            nationality, ethnicity, services, lat, lng, radius
        });
        const cacheHash = Buffer.from(cacheKey).toString('base64').slice(0, 32);
        
        return NextResponse.json(profiles, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'ETag': cacheHash
            }
        });
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({error: 'Failed to fetch profiles'}, {status: 500});
    }
}