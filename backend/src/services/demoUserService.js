import { User } from "../models/User.js";
import { hashPassword } from "../utils/auth.js";

export const demoCredentials = {
  teachers: [
    {
      name: "Prof. Ananya Sharma",
      phoneNumber: "9000000001",
      password: "teacher123",
      department: "Computer Science"
    },
    {
      name: "Prof. Rakesh Verma",
      phoneNumber: "9000000002",
      password: "teacher123",
      department: "Electronics"
    }
  ],
  students: [
    {
      name: "Aarav Singh",
      phoneNumber: "9111111101",
      password: "student123",
      rollNumber: "23CSE101",
      section: "B.Tech CSE - A",
      department: "Computer Science"
    },
    {
      name: "Diya Patel",
      phoneNumber: "9111111102",
      password: "student123",
      rollNumber: "23CSE102",
      section: "B.Tech CSE - A",
      department: "Computer Science"
    },
    {
      name: "Kabir Mehta",
      phoneNumber: "9111111103",
      password: "student123",
      rollNumber: "23CSE103",
      section: "B.Tech CSE - A",
      department: "Computer Science"
    }
  ]
};

export const ensureDemoUsers = async () => {
  const allDemoAccounts = [
    ...demoCredentials.teachers.map((teacher) => ({
      ...teacher,
      role: "teacher"
    })),
    ...demoCredentials.students.map((student) => ({
      ...student,
      role: "student"
    }))
  ];

  let seededCount = 0;

  for (const account of allDemoAccounts) {
    const existingUser = await User.findOne({ phoneNumber: account.phoneNumber });

    if (existingUser) {
      let hasUpdates = false;

      if (account.role === "student") {
        if (existingUser.rollNumber !== (account.rollNumber || "")) {
          existingUser.rollNumber = account.rollNumber || "";
          hasUpdates = true;
        }

        if (existingUser.section !== (account.section || "")) {
          existingUser.section = account.section || "";
          hasUpdates = true;
        }
      }

      if (existingUser.department !== account.department) {
        existingUser.department = account.department;
        hasUpdates = true;
      }

      if (existingUser.role !== account.role) {
        existingUser.role = account.role;
        hasUpdates = true;
      }

      if (!existingUser.isDemo) {
        existingUser.isDemo = true;
        hasUpdates = true;
      }

      if (hasUpdates) {
        await existingUser.save();
      }

      continue;
    }

    await User.create({
      name: account.name,
      phoneNumber: account.phoneNumber,
      passwordHash: await hashPassword(account.password),
      role: account.role,
      rollNumber: account.rollNumber || "",
      section: account.section || "",
      department: account.department,
      isDemo: true
    });

    seededCount += 1;
  }

  if (seededCount > 0) {
    console.log(`Seeded ${seededCount} demo login account(s).`);
  }
};
