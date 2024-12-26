const express = require("express");
const app = express();

// Define Nimar Payroll Policy
const nimarPayrollPolicy = {
  shiftTiming: { start: "9:30", end: "19:00" },
  lateAllowed: 10,
  lateAllowedLimit: 3,
  lateDeduction: 0.2, // 20%
  compensatoryOffHours: 6,
  shortLeaveHours: [60, 120], // 1 hour and 2 hours in minutes
  halfDayHours: 270, // 4 hours and 30 minutes in minutes
  sandwichPolicy: true,
  leavePolicy: {
    minService: 6, // months
    maxLeavesPerMonth: 1,
    leaveDays: 18, // excluding Sundays
    carryForward: true,
    carryForwardPeriod: { start: "05-01", end: "08-15" },
  },
  missPunchPolicy: true,
  publicHolidays: [
    "01-26",
    "08-15",
    "Shiv Dola",
    "Holi",
    "Rang Panchami",
    "Padwa",
  ],
  emergencyLeave: 11,
  medicalLeave: 10,
  selfMarriageLeaves: 5,
};

// Sample employee data
const employees = [
  {
    id: 1,
    name: "John Doe",
    role: "Software Engineer",
    joinDate: "2022-01-01",
    attendance: generateAttendanceData(
      new Date(2024, 1, 1),
      new Date(2024, 1, 29)
    ), // Assuming February 2024 for testing
    leaveTaken: [],
  },
  // Include more employees here
];

// Generate random date within a range
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Generate random time within a range
function randomTime(start, end) {
  const time = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return `${time.getHours().toString().padStart(2, "0")}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// Generate random attendance data for a month
// Generate random attendance data for a month with various scenarios
// Generate random attendance data for a month with various scenarios
function generateAttendanceData(startDate, endDate) {
  const attendanceData = [];
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const scenario = Math.floor(Math.random() * 8); // Generate random scenario (0 to 7)
    let inTime, outTime, reason;

    switch (scenario) {
      case 0: // Present
        inTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T09:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T10:00:00`)
        );
        outTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T17:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T18:00:00`)
        );
        break;
      case 1: // Late
        inTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T09:10:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T09:30:00`)
        );
        outTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T17:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T18:00:00`)
        );
        reason = "Late";
        break;
      case 2: // Short Leave
        inTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T09:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T10:00:00`)
        );
        outTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T11:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T12:00:00`)
        );
        reason = "Short Leave";
        break;
      case 3: // Compensatory Off
        inTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T09:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T10:00:00`)
        );
        outTime = randomTime(
          new Date(`${currentDate.toISOString().split("T")[0]}T17:00:00`),
          new Date(`${currentDate.toISOString().split("T")[0]}T18:00:00`)
        );
        reason = "Compensatory Off";
        break;
      case 4: // Public Holiday
        inTime = "00:00";
        outTime = "00:00";
        reason = "Public Holiday";
        break;
      case 5: // Leave
        inTime = "00:00";
        outTime = "00:00";
        reason = "Leave";
        break;
      case 6: // Emergency Leave
        inTime = "00:00";
        outTime = "00:00";
        reason = "Emergency Leave";
        break;
      case 7: // Medical Leave
        inTime = "00:00";
        outTime = "00:00";
        reason = "Medical Leave";
        break;
    }

    attendanceData.push({
      date: currentDate.toISOString().split("T")[0],
      inTime,
      outTime,
      reason,
    });

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add one day
  }
  return attendanceData;
}

// Function to calculate working hours
function calculateWorkingHours(attendance) {
  const inTime = new Date(`2022-01-01 ${attendance.inTime}`);
  const outTime = new Date(`2022-01-01 ${attendance.outTime}`);
  const diffInMinutes = (outTime - inTime) / 60000;
  return diffInMinutes;
}

// Function to check if employee is late
function isLate(attendance, policy) {
  const inTime = new Date(`2022-01-01 ${attendance.inTime}`);
  const shiftStart = new Date(`2022-01-01 ${policy.shiftTiming.start}`);
  const lateBy = inTime - shiftStart;
  const lateInMinutes = lateBy / 60000;
  return lateInMinutes > policy.lateAllowed;
}

// Function to calculate late deduction
function calculateLateDeduction(attendance, policy) {
  const lateDeduction =
    policy.lateDeduction * attendance.filter((a) => isLate(a, policy)).length;
  return lateDeduction;
}

// Function to check if employee is eligible for short leave
function isEligibleForShortLeave(attendance, policy) {
  const workingHours = calculateWorkingHours(attendance);
  const shortLeaveHours = policy.shortLeaveHours;
  return shortLeaveHours.some((h) => workingHours === h);
}

// Function to check if employee is eligible for compensatory off
function isEligibleForCompensatoryOff(attendance, policy) {
  const workingHours = calculateWorkingHours(attendance);
  return workingHours >= policy.compensatoryOffHours;
}

// Function to check if employee is eligible for public holiday
function isEligibleForPublicHoliday(date, policy) {
  return policy.publicHolidays.includes(date);
}

// Function to check if employee is eligible for leave
function isEligibleForLeave(employee, policy) {
  const today = new Date();
  const joinDate = new Date(employee.joinDate);
  const serviceMonths =
    ((today.getFullYear() - joinDate.getFullYear()) * 12 +
      today.getMonth() -
      joinDate.getMonth()) /
    3;
  return serviceMonths >= policy.leavePolicy.minService;
}

// Function to calculate leave balance
function calculateLeaveBalance(employee, policy) {
  const today = new Date();
  const leaveBalance = employee.leaveTaken.filter(
    (leave) =>
      leave.date.getMonth() === today.getMonth() &&
      leave.date.getFullYear() === today.getFullYear()
  ).length;
  return policy.leavePolicy.maxLeavesPerMonth - leaveBalance;
}

// Function to calculate attendance
function calculateAttendance(employees, policy) {
  employees.forEach((employee) => {
    employee.attendance.forEach((day, index, array) => {
      const attendance = {
        present: 0,
        late: 0,
        shortLeave: 0,
        compensatoryOff: 0,
        publicHoliday: 0,
        leave: 0,
        absent: 0,
        emergencyLeave: 0,
        medicalLeave: 0,
        selfMarriageLeaves: 0,
        totalHours: 0,
        salary: 0,
      };

      const workingHours = calculateWorkingHours(day);
      attendance.totalHours += workingHours;

      if (isLate(day, policy)) {
        attendance.late++;
      }

      if (isEligibleForShortLeave(day, policy)) {
        attendance.shortLeave++;
      }

      if (isEligibleForCompensatoryOff(day, policy)) {
        attendance.compensatoryOff++;
      }

      if (isEligibleForPublicHoliday(day.date, policy)) {
        attendance.publicHoliday++;
      }

      if (isEligibleForLeave(employee, policy)) {
        const leaveBalance = calculateLeaveBalance(employee, policy);
        if (leaveBalance > 0) {
          attendance.leave++;
        }
      }

      // Calculate absent days based on total working days
      if (workingHours < policy.halfDayHours) {
        attendance.absent += 0.5;
      }

      // Implement Sandwich Policy
      if (policy.sandwichPolicy && index > 0 && index < array.length - 1) {
        const previousDay = array[index - 1];
        const nextDay = array[index + 1];
        const isWeeklyOff = calculateWorkingHours(day) === 0;
        if (
          isWeeklyOff &&
          calculateWorkingHours(previousDay) > 0 &&
          calculateWorkingHours(nextDay) > 0
        ) {
          attendance.absent += 1;
        }
      }

      day.attendance = attendance;
    });
  });
}

// Define hourly rate
const policy = {
  ...nimarPayrollPolicy,
  hourlyRate: 100, // in rupees
};

// Calculate attendance
calculateAttendance(employees, policy);

// Print attendance
employees.forEach((employee) => {
  console.log(`Employee: ${employee.name}`);
  employee.attendance.forEach((day) => {
    console.log(`Date: ${day.date}`);
    console.log(`Status: ${getAttendanceStatus(day.attendance)}`);
    console.log("-------------------");
  });
});

function getAttendanceStatus(attendance) {
  if (attendance.present > 0) {
    return "P";
  } else if (attendance.late > 0) {
    return "PL";
  } else if (attendance.shortLeave > 0) {
    return "SL";
  } else if (attendance.compensatoryOff > 0) {
    return "CO";
  } else if (attendance.publicHoliday > 0) {
    return "PH";
  } else if (attendance.leave > 0) {
    return "L";
  } else if (attendance.absent > 0) {
    return "A";
  } else if (attendance.emergencyLeave > 0) {
    return "EL";
  } else if (attendance.medicalLeave > 0) {
    return "ML";
  } else if (attendance.selfMarriageLeaves > 0) {
    return "SMLeaves";
  } else {
    return "No Data";
  }
}

// Define routes
app.get("/", (req, res) => {
  res.send("Attendance System");
});

app.listen(3000, () => {
  console.log("Attendance System listening on port 3000");
});