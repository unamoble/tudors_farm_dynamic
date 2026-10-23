# Tudor Farm Cottages Dynamic Website

Tudor Farm Cottages Dynamic Website is a mobile-first hospitality website with an integrated lightweight admin system for managing room listings, gallery images, and key site content.

The public website is built with HTML, Tailwind CSS, and vanilla JavaScript, while backend functionality is handled through Vercel serverless API functions. Content is stored as JSON data files, allowing the site to stay fast and simple while still being easy to update.

The project includes:

- A customer-facing website for browsing cottages, rooms, and gallery content
- An admin panel for creating, editing, and deleting room and gallery entries
- JSON-based content management for straightforward updates
- Serverless API endpoints that support dynamic content operations

## Gallery categories

Gallery records live in `data/gallery.json`. Each record can include a `categories`
array using the supported labels `Recent`, `Night`, `Day`, `Pool`, `Guests`, `Rooms`,
`Nature`, and `Dining`, for example:

```json
{
  "url": "/assets/images/swimming_pool_day.jpeg",
  "alt": "Swimming pool during the day",
  "categories": ["Pool", "Day"]
}
```

Add a category to the record when adding or editing a photo. `Recent` is always
available and uses the source array order until reliable `dateAdded` values are
available for every record; if dates are later added consistently, they are sorted
newest first automatically.

This repository represents a modern static-plus-serverless architecture designed for a clean user experience, easy maintainability, and practical content control without a traditional CMS.
