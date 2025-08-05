const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a Freelance User
  const freelancer = await prisma.user.create({
    data: {
      email: 'freelancer@example.com',
      password: 'securepassword',
      name: 'John Doe',
      role: 'FREELANCER',
      isVerified: true,
      Freelancer: {
        create: {
          fullName: 'John Doe',
          hourlyRate: 50,
          experienceLevel: 'MID',
        },
      },
    },
  });

  // Create a Client User
  const client = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: 'anothersecurepassword',
      name: 'Jane Smith',
      role: 'CLIENT',
      isVerified: true,
      Client: {
        create: {
          fullName: 'Jane Smith',
          companyName: 'Acme Corp',
        },
      },
    },
  });

  // Client adds a job
  const job = await prisma.job.create({
    data: {
      clientId: client.Client.id,
      title: 'Create a Business Logo',
      description: 'Design and develop a business logo for Acme Corp',
      budget: 500,
      category: 'Design',
      status: 'OPEN',
    },
  });

  // Freelancer submits a proposal
  const proposal = await prisma.proposal.create({
    data: {
      freelancerId: freelancer.Freelancer.id,
      jobId: job.id,
      coverLetter: 'I am an experienced designer ready to work on your logo project.',
      proposedRate: 450,
    },
  });

  console.log('Users, job, and proposal created successfully!');

  // Client sends a message to Freelancer
  const message = await prisma.message.create({
    data: {
      senderId: client.id,
      receiverId: freelancer.id,
      content: 'Hi John, I am interested in discussing the project further.',
      conversation: {
        connectOrCreate: {
          where: {
            user1Id_user2Id: {
              user1Id: client.id,
              user2Id: freelancer.id,
            },
          },
          create: {
            user1Id: client.id,
            user2Id: freelancer.id,
            lastActivity: new Date(),
          },
        },
      },
    },
  });

  console.log('Message sent successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
