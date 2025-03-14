// scripts/set-admin.ts
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt for email
function askForEmail(): Promise<string> {
    return new Promise((resolve) => {
        rl.question('Enter the email of the user to make admin: ', (email) => {
            resolve(email.trim());
        });
    });
}

// Function to confirm action
function confirmAction(email: string): Promise<boolean> {
    return new Promise((resolve) => {
        rl.question(`Are you sure you want to make ${email} an admin? (y/n): `, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function makeUserAdmin() {
    try {
        console.log('=== Make User Admin ===');

        // Ask for email
        const email = await askForEmail();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        // If user is already admin
        if (user.role === 'admin') {
            console.log(`${user.name || user.email} is already an admin.`);
            return;
        }

        // Confirm action
        const confirmed = await confirmAction(email);

        if (!confirmed) {
            console.log('Operation cancelled.');
            return;
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'admin' },
            select: { id: true, name: true, email: true, role: true }
        });

        console.log(`Successfully made ${updatedUser.name || updatedUser.email} an admin!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close readline and disconnect prisma
        rl.close();
        await prisma.$disconnect();
    }
}

// Run the script
makeUserAdmin();