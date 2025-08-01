// Simple script to check if admin exists in database
import { storage } from '../server/storage.js';

async function checkAdmin() {
  try {
    console.log('Checking admin credentials in database...');
    
    const admin1 = await storage.getAdminByEmail('admin@p91carcare.com');
    const admin2 = await storage.getAdminByEmail('p91admin@carcare.com');
    
    console.log('Admin 1 (admin@p91carcare.com):', admin1 ? 'EXISTS' : 'NOT FOUND');
    console.log('Admin 2 (p91admin@carcare.com):', admin2 ? 'EXISTS' : 'NOT FOUND');
    
    if (admin1) {
      console.log('Admin 1 details:', { id: admin1.id, email: admin1.email, name: admin1.name });
    }
    
    if (admin2) {
      console.log('Admin 2 details:', { id: admin2.id, email: admin2.email, name: admin2.name });
    }
    
  } catch (error) {
    console.error('Error checking admin:', error);
  }
}

checkAdmin();