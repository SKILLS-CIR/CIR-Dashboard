const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const bookings = await prisma.classroomBooking.findMany({
            where: {
                isCancelled: false
            },
            take: 10,
            select: { id: true, title: true, description: true, classroomId: true, bookingDate: true }
        });
        console.log('Bookings in DB:', bookings);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
