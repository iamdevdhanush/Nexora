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
  { name: 'JoltJS', status: 'ACTIVE' as TeamStatus, room: 'A-104', phone: '+919876540011', project: 'Edge Computing Runtime', members: ['Abhishek Das', 'Richa Verma'] },
  { name: 'KernelPanic', status: 'SUBMITTED' as TeamStatus, room: 'B-203', phone: '+919876540012', project: 'Linux Kernel Profiler', members: ['Girish Nair', 'Anita Mishra', 'Sameer Gupta'] },
  { name: 'LambdaLock', status: 'CHECKED_IN' as TeamStatus, room: 'C-303', phone: '+919876540013', project: 'Zero-Trust Auth SDK', members: ['Harish Pillai', 'Deepa Shah'] },
  { name: 'MeshMakers', status: 'ACTIVE' as TeamStatus, room: 'D-402', phone: '+919876540014', project: 'P2P Video Streaming', members: ['Rajesh Kumar', 'Smita Bhat', 'Akash Tiwari'] },
  { name: 'NullPointer', status: 'REGISTERED' as TeamStatus, room: undefined, phone: '+919876540015', project: undefined, members: ['Vinod Singh', 'Anjali Reddy'] },
  { name: 'OctaFlow', status: 'CHECKED_IN' as TeamStatus, room: 'A-105', phone: '+919876540016', project: 'ML Pipeline Automation', members: ['Suresh Joshi', 'Kavitha Patel', 'Nitin Sharma'] },
  { name: 'PulseBit', status: 'ACTIVE' as TeamStatus, room: 'B-204', phone: '+919876540017', project: 'Wearable Health Monitor', members: ['Balaji Das', 'Chitra Verma'] },
  { name: 'QuantumByte', status: 'REGISTERED' as TeamStatus, room: undefined, phone: '+919876540018', project: undefined, members: ['Mohit Gupta', 'Sunanda Rao'] },
  { name: 'RustForge', status: 'SUBMITTED' as TeamStatus, room: 'C-304', phone: '+919876540019', project: 'Memory-Safe Web Server', members: ['Ashwin Nair', 'Padma Krishnan'] },
  { name: 'SkyHook', status: 'ACTIVE' as TeamStatus, room: 'D-403', phone: '+919876540020', project: 'Drone Fleet Manager', members: ['Dinesh Shah', 'Kaveri Mishra', 'Ramesh Kumar'] },
  { name: 'TokenTribe', status: 'CHECKED_IN' as TeamStatus, room: 'A-106', phone: '+919876540021', project: 'NFT Marketplace', members: ['Aryan Tiwari', 'Shobha Menon'] },
  { name: 'UltraSync', status: 'ACTIVE' as TeamStatus, room: 'B-205', phone: '+919876540022', project: 'Real-time DB Sync', members: ['Karthik Singh', 'Nalini Reddy'] },
  { name: 'VectorVault', status: 'REGISTERED' as TeamStatus, room: undefined, phone: '+919876540023', project: undefined, members: ['Prakash Patel', 'Sudha Das'] },
  { name: 'WireFrame', status: 'CHECKED_IN' as TeamStatus, room: 'C-305', phone: '+919876540024', project: 'Design System CLI', members: ['Ajay Sharma', 'Meena Verma', 'Sunil Gupta'] },
  { name: 'XenoStack', status: 'SUBMITTED' as TeamStatus, room: 'D-404', phone: '+919876540025', project: 'Multi-Cloud Orchestrator', members: ['Vikas Pillai', 'Rekha Nair'] },
];

async function main() {
  console.log('🌱 Seeding Nexora…');

  // Create super admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexora.dev' },
    update: {},
    create: { name: 'Nexora Admin', email: 'admin@nexora.dev', role: 'SUPER_ADMIN' },
  });

  // Create coordinators
  const coords = await Promise.all([
    prisma.user.upsert({ where: { email: 'coord1@nexora.dev' }, update: {}, create: { name: 'Riya Sharma', email: 'coord1@nexora.dev', role: 'COORDINATOR' } }),
    prisma.user.upsert({ where: { email: 'coord2@nexora.dev' }, update: {}, create: { name: 'Aakash Patel', email: 'coord2@nexora.dev', role: 'COORDINATOR' } }),
    prisma.user.upsert({ where: { email: 'coord3@nexora.dev' }, update: {}, create: { name: 'Sonal Mehta', email: 'coord3@nexora.dev', role: 'COORDINATOR' } }),
  ]);

  // Create hackathon
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
      createdById: admin.id,
    },
  });

  // Assign coordinators
  const assignments = await Promise.all(
    coords.map((c) => prisma.coordinatorAssignment.upsert({
      where: { hackathonId_userId: { hackathonId: hackathon.id, userId: c.id } },
      update: {},
      create: { hackathonId: hackathon.id, userId: c.id },
    }))
  );

  // Create teams
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
        coordinatorId: ['REGISTERED'].includes(t.status) ? undefined : assignment.id,
        checkInTime: ['CHECKED_IN', 'ACTIVE', 'SUBMITTED'].includes(t.status)
          ? new Date(Date.now() - Math.random() * 3600000 * 6) : undefined,
        submissionTime: t.status === 'SUBMITTED'
          ? new Date(Date.now() - Math.random() * 3600000) : undefined,
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

  // Seed OTP for admin (so you can log in without email)
  await prisma.otpCode.create({
    data: {
      code: '000000',
      contact: 'admin@nexora.dev',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600000),
      userId: admin.id,
    },
  });

  console.log('\n✅ Seed complete!');
  console.log('   Login: admin@nexora.dev  OTP: 000000  (dev mode shows OTP anyway)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
