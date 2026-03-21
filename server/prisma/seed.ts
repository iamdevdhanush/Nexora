import { PrismaClient, TeamStatus } from '@prisma/client';
const prisma = new PrismaClient();

const TEAMS = [
  { name: 'NeuralForge', status: 'SUBMITTED' as TeamStatus, room: 'A-101', phone: '+919876540001', project: 'AI Triage Assistant', members: ['Arjun Mehta', 'Priya Sharma', 'Rohit Das'] },
  { name: 'QuantumLeap', status: 'ACTIVE' as TeamStatus, room: 'A-102', phone: '+919876540002', project: 'Quantum Trading Bot', members: ['Vikram Singh', 'Ananya Patel'] },
  { name: 'ByteBenders', status: 'CHECKED_IN' as TeamStatus, room: 'B-201', phone: '+919876540003', project: 'Mesh Networking SDK', members: ['Kiran Kumar', 'Sneha Rao', 'Amit Joshi', 'Divya Nair'] },
  { name: 'CodeCraft', status: 'REGISTERED' as TeamStatus, room: undefined, phone: '+919876540004', project: undefined, members: ['Rahul Verma', 'Pooja Mishra'] },
  { name: 'DataDen', status: 'ACTIVE' as TeamStatus, room: 'C-301', phone: '+919876540005', project: 'Fraud Detector', members: ['Sanjay Gupta', 'Meera Krishnan', 'Nikhil Jain'] },
  { name: 'EtherEdge', status: 'CHECKED_IN' as TeamStatus, room: 'A-103', phone: '+919876540006', project: 'DeFi Yield Optimizer', members: ['Tanvi Bhat', 'Suresh Pillai'] },
  { name: 'FusionLabs', status: 'SUBMITTED' as TeamStatus, room: 'B-202', phone: '+919876540007', project: 'AR Navigation for Blind', members: ['Kavita Reddy', 'Yash Shah', 'Deepak Tiwari'] },
  { name: 'GridMind', status: 'ACTIVE' as TeamStatus, room: 'C-302', phone: '+919876540008', project: 'Smart Grid Optimizer', members: ['Arun Menon', 'Shweta Singh'] },
  { name: 'HexCore', status: 'REGISTERED' as TeamStatus, room: undefined, phone: '+919876540009', project: undefined, members: ['Nitesh Sharma', 'Rakhi Gupta'] },
  { name: 'InfinityIO', status: 'CHECKED_IN' as TeamStatus, room: 'D-401', phone: '+919876540010', project: 'Serverless Orchestration', members: ['Manish Joshi', 'Sunita Rao', 'Vijay Patel'] },
];

async function main() {
  console.log('🌱 Seeding Nexora…');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexora.dev' },
    update: {},
    create: { name: 'Nexora Admin', email: 'admin@nexora.dev', role: 'SUPER_ADMIN' },
  });

  const coords = await Promise.all([
    prisma.user.upsert({ where: { email: 'coord1@nexora.dev' }, update: {}, create: { name: 'Riya Sharma', email: 'coord1@nexora.dev', role: 'COORDINATOR' } }),
    prisma.user.upsert({ where: { email: 'coord2@nexora.dev' }, update: {}, create: { name: 'Aakash Patel', email: 'coord2@nexora.dev', role: 'COORDINATOR' } }),
  ]);

  const hackathon = await prisma.hackathon.upsert({
    where: { id: 'seed-hackathon-01' },
    update: {},
    create: {
      id: 'seed-hackathon-01',
      name: 'BuildFest 2024',
      description: 'The premier hackathon for builders and makers.',
      venue: 'Tech Hub, Bangalore',
      startDate: new Date('2024-11-15T09:00:00'),
      endDate: new Date('2024-11-16T18:00:00'),
      status: 'ACTIVE',
      maxTeams: 30,
      mode: 'PREDEFINED',
      createdById: admin.id,
    },
  });

  const assignments = await Promise.all(
    coords.map((c) =>
      prisma.coordinatorAssignment.upsert({
        where: { hackathonId_userId: { hackathonId: hackathon.id, userId: c.id } },
        update: {},
        create: { hackathonId: hackathon.id, userId: c.id },
      })
    )
  );

  for (let i = 0; i < TEAMS.length; i++) {
    const t = TEAMS[i];
    const assignment = assignments[i % assignments.length];
    await prisma.team.upsert({
      where: { hackathonId_name: { hackathonId: hackathon.id, name: t.name } },
      update: {},
      create: {
        hackathonId: hackathon.id,
        name: t.name,
        status: t.status,
        room: t.room,
        leaderPhone: t.phone,
        projectName: t.project,
        coordinatorId: t.status === 'REGISTERED' ? undefined : assignment.id,
        checkInTime: ['CHECKED_IN', 'ACTIVE', 'SUBMITTED'].includes(t.status)
          ? new Date(Date.now() - Math.random() * 3600000 * 6)
          : undefined,
        submissionTime: t.status === 'SUBMITTED'
          ? new Date(Date.now() - Math.random() * 3600000)
          : undefined,
        participants: {
          create: t.members.map((name, idx) => ({
            name,
            email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
            phone: idx === 0 ? t.phone : undefined,
            isLeader: idx === 0,
          })),
        },
      },
    });
    console.log(`  ✓ ${t.name} [${t.status}]`);
  }

  // Seed invite link
  await prisma.inviteLink.create({
    data: {
      hackathonId: hackathon.id,
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    },
  });

  // Seed dev OTP for admin
  await prisma.otpCode.create({
    data: {
      code: '123456',
      contact: 'admin@nexora.dev',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600000),
      userId: admin.id,
    },
  });

  console.log('\n✅ Seed complete!');
  console.log('   Login: admin@nexora.dev  →  OTP: 123456 (shown in dev console)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
