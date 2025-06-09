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

        // Parse command line arguments
        const args = process.argv.slice(2);
        const skipConfirmation = args.includes('-y') || args.includes('--yes');
        
        // Get email from command line argument or ask for it
        let email: string;
        const emailArg = args.find(arg => !arg.startsWith('-'));
        if (emailArg) {
            email = emailArg.trim();
            console.log(`Using provided email: ${email}`);
        } else {
            email = await askForEmail();
        }

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

        // Confirm action (skip if -y flag is provided)
        let confirmed = skipConfirmation;
        if (!skipConfirmation) {
            confirmed = await confirmAction(email);
        } else {
            console.log(`Skipping confirmation due to -y flag.`);
        }

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