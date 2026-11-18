/**
 * Customer reviews shown on the homepage.
 *
 * FILLED WITH REAL GOOGLE REVIEWS (copied word for word from the studio's Google Maps listing on 18 Nov 2026, typos and
 * emoji included). It was empty before, on purpose. The site used to carry 21 testimonials and a "4.9 / 5.0" rating that
 * nobody could match to a real source, so they were removed (see ppf-ceramic-landing.tsx).
 * The homepage "Reviews" section renders only when this list has entries, so an empty list
 * means no section, never placeholder text.
 *
 * TO ADD ONE: copy a review word for word from the studio's Google Business Profile, with
 * the reviewer's name as Google shows it. Do not edit the wording, do not add a star
 * rating or a count unless it is read from the profile on the same day, and do not add
 * Review / AggregateRating structured data: Google does not show review stars for a
 * business's own reviews of itself, and self-served review markup can earn a manual action.
 */
export interface VerifiedReview {
  /** The review text exactly as it appears on Google. */
  text: string;
  /** Reviewer name as Google shows it. */
  name: string;
  /** Optional: the car, if the review names it. */
  vehicle?: string;
  /** Optional: the service, if the review names it. */
  service?: string;
}

/** Shown on the home page: the first HOME_REVIEW_COUNT entries, in this order. The rest are kept for later use. */
export const HOME_REVIEW_COUNT = 6;

export const VERIFIED_REVIEWS: VerifiedReview[] = [
  {
    name: "Nilesh Parson",
    text: "I recently took my brand new Mahindra XUV 7XO to P91 Car Care for a full STEK Paint Protection Film (PPF) installation, and the entire experience was top-tier from start to finish. Finding a shop you can trust with a brand-new vehicle is tough, but these guys knocked it out of the park. They gave me a clear, upfront quote and a realistic timeline—and stuck to both perfectly. The XUV 7XO has a lot of intricate design elements—from the distinct C-shaped DRLs to the flush door handles and complex front grille accents. The installation team handled these curves like absolute masters. Their workshop is well-lit and spacious. It’s clear they take immense pride in maintaining a premium shop. If you want an elite, no-compromise PPF job for your vehicle, P91 Car Care is the definitive place to go.",
  },
  {
    name: "Pratham Pandit",
    text: "I gave my car to P91 Car Care for ceramic coating, and honestly, they did the best work ever! The finish was excellent, and they completed the work very quickly, which really helped because I had to travel a long distance. The owner was extremely polite, explained everything clearly, and kept me updated throughout the process. I’m genuinely grateful for their excellent service and professionalism. Highly recommend P91 Car Care to anyone looking for quality car care services! 👏❤️",
  },
  {
    name: "suresh kumar",
    text: "I recently got P91 PPF installed on my car, and I’m really impressed with the overall quality and finish. The film gives the paint a beautiful glossy and premium look, while providing excellent protection against minor scratches, road debris, and everyday wear and tear.",
  },
  {
    name: "sushant sher",
    text: "Great team, they know very well what they are doing. Attention to detail,timely follow ups and updates. My car looks better than what it looked out of showroom. Special mention for Boni and Vishal",
  },
  {
    name: "Rahul Manikanavar",
    text: "Great service and excellent PPF quality. The installation was neat, the staff was professional, and my car looks amazing. Highly recommend this place!",
  },
  {
    name: "Shreyash Gupta",
    text: "I got the Ceramic coating done from them. Great results and attention to details. Also helped with minor touch ups for best outcome.",
  },
  {
    name: "Lily Rose",
    text: "Absolutely loved the ceramic coating by P91 Car Care! 🚗✨ Amazing finish, excellent quality, and attention to detail at an unbelievable price, Team did a greta job & Bony was very helpful & co-ordinating. Will get my other car also done here and recommend my friends for sure. Highly recommend P91 Car Care — truly 5-star work! ⭐⭐⭐⭐⭐",
  },
  {
    name: "Rahul Mehta",
    text: "I recently visited this place to get window films installed on my 2026 Hyundai Creta, and I had a fantastic experience the owner is incredibly humble, friendly, and down-to-earth, which made the entire process smooth and pleasant The team is highly skilled and did a neat, professional installation The pricing was very reasonable at Rs.10,000 and they even cleaned my car thoroughly inside and out before handing it back The attention to detail and customer service truly stood out Highly recommended if you’re looking for quality work and excellent service!",
  },
  {
    name: "YATHISH N",
    text: "I recently got ceramic coating done for my Toyota Innova Crysta at P91 Car Care, and I’m very satisfied with the overall experience. The team was highly professional and explained the entire process in detail before starting. Especially Nikhil has welcomed our car and explained every single point before the work has been started. The car’s paint finish has significantly improved — it now has a deep gloss and a premium shine that really stands out. The coating also gives a smooth surface, making cleaning much easier and helping repel dust and water effectively. What impressed me the most was their attention to detail and the quality of work. Every corner of the vehicle was handled with care, and the final delivery exceeded my expectations.",
  },
  {
    name: "Mohammed Tahir",
    text: "I had contacted P91 care at 2:30 and told that I will be there at 3:30, it was 4 till I reached there but P91 care arranged everything and started service. Had a great time with owner while car wash was going on. Overall service was great, must visit this car care center. Thank you for your great service! Well done 5 ⭐️",
  },
  {
    name: "sundeep paruchuru",
    text: "Got my car cleaned today and they did an excellent job. Very thorough and detail-oriented—nothing felt rushed or missed. The car looks and feels genuinely clean. For the price they charge, the service is absolutely worth it. Strong value for money and definitely recommended.",
  },
  {
    name: "Dhanush Dhanush",
    text: "Recently I visited p91 car care to do ppf for my new z900 an I like the work an Good Quality an thanks for Nikhil sir for taking care of my bike",
  },
  {
    name: "Deepak",
    text: "Came to know about this place through INSTAGRAM..must say a very well maintained and highly recommended place undoubtedly top notch service and as it's offer time had a great experience met nikhil who owns this place great guy..a must get ur work done place ...once again huge clean and satisfactory place....all the best to Nikhil and his team👍",
  },
  {
    name: "jithu m",
    text: "I got ppf done for my car must say real professional work at affordable pricing . Contact Mr Hitesh and Mr Vishal they will suggest with the best solution. I personally had a very smooth experience Highly recommended .",
  },
  {
    name: "Fazil Ahmed",
    text: "I recently availed P91's basic car wash service at an unbeatable offer price of ₹199 + tax. The experience was excellent! Nikhil and his team were extremely courteous and polite, taking the time to explain various packages and options to help maintain my car's cleanliness. I'm impressed with the service and staff, and I'm definitely looking forward to being a repeat customer. I highly recommend trying out their offer prices before they expire - it's a great value for money!",
  },
];

/** The studio's Google listing, for the "Read reviews on Google" link. */
export const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru";
