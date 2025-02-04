import clientPromise from '@/libs/mongodb';
import { ObjectId } from 'mongodb';

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizePropertyName(name) {
  // Replace colons with underscores to avoid namespace issues
  return name.replace(/:/g, '_');
}

function jsonToXml(obj) {
  let xml = '';
  
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      // Sanitize and escape the property name
      const safeProp = escapeXml(sanitizePropertyName(prop));
      
      if (Array.isArray(obj[prop])) {
        // Handle arrays
        xml += obj[prop].map(item => 
          `<${safeProp}>${typeof item === 'object' ? jsonToXml(item) : escapeXml(item)}</${safeProp}>`
        ).join('');
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        // Handle nested objects
        xml += `<${safeProp}>${jsonToXml(obj[prop])}</${safeProp}>`;
      } else {
        // Handle primitive values
        xml += `<${safeProp}>${escapeXml(obj[prop])}</${safeProp}>`;
      }
    }
  }
  
  return xml;
}

export async function GET(request) {
  try {
    // Get the scraper ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Scraper ID is required', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the scraper by ID
    const scraper = await db.collection('scrapers').findOne({
      _id: new ObjectId(id)
    });

    if (!scraper) {
      return new Response('Scraper not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    if (!scraper.lastFirecrawlResponse) {
      return new Response('No scrape data available', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Convert the firecrawl response to XML
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<root>${jsonToXml(scraper.lastFirecrawlResponse)}</root>`;

    // Return XML response
    return new Response(xmlString, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating XML:', error);
    return new Response(error.message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
