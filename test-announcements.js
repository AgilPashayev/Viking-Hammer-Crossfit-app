const crypto = require('crypto');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4001/api';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, title);
  console.log('='.repeat(60) + '\n');
}

// Test users with UUID
const testUsers = {
  sparta: {
    id: crypto.randomUUID(),
    email: 'sparta@test.com',
    role: 'sparta'
  },
  reception: {
    id: crypto.randomUUID(),
    email: 'reception@test.com',
    role: 'reception'
  },
  member: {
    id: crypto.randomUUID(),
    email: 'member@test.com',
    role: 'member'
  }
};

let createdAnnouncementIds = [];

async function runTests() {
  logSection(' ANNOUNCEMENT FUNCTIONALITY - COMPLETE DEEP TESTING');
  
  log(colors.blue, 'Test Users Created:');
  Object.values(testUsers).forEach(user => {
    log(colors.cyan,  -  (): );
  });
  
  // Test 1: POST - Create announcement as Sparta
  await testCreateAnnouncementAsSpartaRole();
  
  // Test 2: POST - Create announcement as Reception
  await testCreateAnnouncementAsReceptionRole();
  
  // Test 3: GET - Fetch all announcements
  await testFetchAllAnnouncements();
  
  // Test 4: GET - Fetch member announcements
  await testFetchMemberAnnouncements();
  
  // Test 5: POST - Mark as read
  await testMarkAsRead();
  
  // Test 6: Verify per-user read tracking
  await testPerUserReadTracking();
  
  // Test 7: Verify persistence
  await testPersistence();
  
  logSection(' TEST SUMMARY');
  log(colors.green, ' All tests completed!');
  log(colors.cyan, Created announcements: );
}

async function testCreateAnnouncementAsSpartaRole() {
  logSection('TEST 1: Create Announcement (Sparta Role)');
  
  const payload = {
    title: 'TEST - Sparta Announcement',
    content: 'This announcement was created by Sparta role to test UUID integration',
    targetAudience: 'all',
    priority: 'normal',
    createdBy: testUsers.sparta.id
  };
  
  log(colors.blue, 'Request:');
  log(colors.cyan, 'POST ' + API_BASE + '/announcements');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(API_BASE + '/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' SUCCESS - Announcement created');
      log(colors.cyan, 'Announcement ID:', result.data.id);
      log(colors.cyan, 'Created by UUID:', result.data.created_by);
      log(colors.cyan, 'Status:', result.data.status);
      createdAnnouncementIds.push(result.data.id);
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      log(colors.red, ' FAILED:', result.error);
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testCreateAnnouncementAsReceptionRole() {
  logSection('TEST 2: Create Announcement (Reception Role)');
  
  const payload = {
    title: 'TEST - Reception Announcement',
    content: 'Welcome! This message was created by Reception staff',
    targetAudience: 'members',
    priority: 'high',
    createdBy: testUsers.reception.id
  };
  
  log(colors.blue, 'Request:');
  log(colors.cyan, 'POST ' + API_BASE + '/announcements');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(API_BASE + '/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' SUCCESS - Announcement created');
      log(colors.cyan, 'Announcement ID:', result.data.id);
      log(colors.cyan, 'Created by UUID:', result.data.created_by);
      log(colors.cyan, 'Target audience:', result.data.target_audience);
      log(colors.cyan, 'Priority:', result.data.priority);
      createdAnnouncementIds.push(result.data.id);
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      log(colors.red, ' FAILED:', result.error);
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testFetchAllAnnouncements() {
  logSection('TEST 3: Fetch All Announcements');
  
  log(colors.blue, 'Request:');
  log(colors.cyan, 'GET ' + API_BASE + '/announcements');
  
  try {
    const response = await fetch(API_BASE + '/announcements');
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' SUCCESS - Fetched ' + result.data.length + ' announcements');
      
      result.data.slice(0, 5).forEach((ann, i) => {
        log(colors.cyan, \n. );
        log(colors.cyan,    ID: );
        log(colors.cyan,    Created by: );
        log(colors.cyan,    Read by users: []);
      });
      
      if (result.data.length > 5) {
        log(colors.cyan, \n... and  more);
      }
    } else {
      log(colors.red, ' FAILED:', result.error);
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testFetchMemberAnnouncements() {
  logSection('TEST 4: Fetch Member Announcements');
  
  log(colors.blue, 'Request:');
  log(colors.cyan, 'GET ' + API_BASE + '/announcements/member');
  
  try {
    const response = await fetch(API_BASE + '/announcements/member');
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' SUCCESS - Fetched ' + result.data.length + ' member announcements');
      
      const memberAnnouncements = result.data.filter(
        ann => ann.target_audience === 'all' || ann.target_audience === 'members'
      );
      
      log(colors.cyan, 'Filtered for members:', memberAnnouncements.length);
      
      memberAnnouncements.slice(0, 3).forEach((ann, i) => {
        log(colors.cyan, \n. );
        log(colors.cyan,    Target: );
        log(colors.cyan,    Priority: );
      });
    } else {
      log(colors.red, ' FAILED:', result.error);
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testMarkAsRead() {
  logSection('TEST 5: Mark Announcement as Read');
  
  if (createdAnnouncementIds.length === 0) {
    log(colors.yellow, '  No announcements created to test');
    return;
  }
  
  const annId = createdAnnouncementIds[0];
  const userId = testUsers.member.id;
  
  log(colors.blue, 'Request:');
  log(colors.cyan, POST /announcements//mark-read);
  log(colors.cyan, 'Body: { userId: "' + userId + '" }');
  
  try {
    const response = await fetch(${API_BASE}/announcements//mark-read, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' SUCCESS - Marked as read');
      log(colors.cyan, 'Message:', result.message);
    } else {
      log(colors.red, ' FAILED:', result.error);
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testPerUserReadTracking() {
  logSection('TEST 6: Per-User Read Tracking');
  
  if (createdAnnouncementIds.length === 0) {
    log(colors.yellow, '  No announcements created to test');
    return;
  }
  
  const annId = createdAnnouncementIds[0];
  
  log(colors.blue, 'Fetching announcement ' + annId + ' to verify read_by_users');
  
  try {
    const response = await fetch(API_BASE + '/announcements');
    const result = await response.json();
    
    if (result.success) {
      const announcement = result.data.find(ann => ann.id === annId);
      
      if (announcement) {
        log(colors.green, ' Found announcement');
        log(colors.cyan, 'Title:', announcement.title);
        log(colors.cyan, 'Read by users:', JSON.stringify(announcement.read_by_users || []));
        
        const memberRead = (announcement.read_by_users || []).includes(testUsers.member.id);
        
        if (memberRead) {
          log(colors.green, ' Member user IS in read_by_users array (correct)');
        } else {
          log(colors.yellow, '  Member user NOT in read_by_users array');
        }
      } else {
        log(colors.red, ' Announcement not found');
      }
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

async function testPersistence() {
  logSection('TEST 7: Verify Persistence');
  
  log(colors.blue, 'Re-fetching all announcements to verify data persisted');
  
  try {
    const response = await fetch(API_BASE + '/announcements');
    const result = await response.json();
    
    if (result.success) {
      log(colors.green, ' Data persisted - Found ' + result.data.length + ' announcements');
      
      // Verify our created announcements exist
      const ourAnnouncements = result.data.filter(ann => 
        createdAnnouncementIds.includes(ann.id)
      );
      
      if (ourAnnouncements.length === createdAnnouncementIds.length) {
        log(colors.green,  All  created announcements found in database);
        
        ourAnnouncements.forEach(ann => {
          log(colors.cyan, \n- );
          log(colors.cyan,   ID: );
          log(colors.cyan,   Created by:  (UUID format: ));
          log(colors.cyan,   Read by:  users);
        });
      } else {
        log(colors.yellow,   Only found / announcements);
      }
    }
  } catch (error) {
    log(colors.red, ' REQUEST FAILED:', error.message);
  }
}

runTests().catch(error => {
  log(colors.red, ' Test suite failed:', error);
  process.exit(1);
});
