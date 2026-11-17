import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseListing, parseModeration } from '../lib/validation.ts';

const owner = '11111111-1111-4111-8111-111111111111';
const valid = {
 submission_id: '22222222-2222-4222-8222-222222222222', title: 'Dar apartment', description: null,
 listing_type: 'sale', property_type: 'apartment', price: 100000, currency: 'TZS', rent_period: null,
 location: 'Mikocheni', city: 'Dar es Salaam', bedrooms: 2, bathrooms: 1, area_sqm: 80,
 agent_name: 'Owner', agent_phone: '+255712345678', agent_whatsapp: '+255712345678',
 image_urls: [`/api/media/property-images/${owner}/33333333-3333-4333-8333-333333333333.jpg`], video_url: null,
};
test('accepts a valid listing and normalizes text', () => {
 assert.equal(parseListing({...valid, title: ' Dar apartment '}, owner).title, 'Dar apartment');
});
for (const [name, patch] of Object.entries({
 'owner spoofing': {owner_id: owner}, 'self approval': {status: 'approved'}, 'self verification': {verified: true},
 'negative price': {price: -10}, 'infinite price': {price: Infinity}, 'numeric string': {price: '100'},
 'fractional bedrooms': {bedrooms: 1.5}, 'missing rent period': {listing_type: 'rent'},
 'sale rent period': {rent_period: 'month'}, 'foreign media': {image_urls: [valid.image_urls[0].replace(owner, valid.submission_id)]},
 'remote media': {image_urls: ['https://attacker.example/image.jpg']}, 'SVG media': {image_urls: [valid.image_urls[0].replace('.jpg', '.svg')]},
 'duplicate media': {image_urls: [valid.image_urls[0], valid.image_urls[0]]},
 'empty media': {image_urls: []}, 'oversized description': {description: 'x'.repeat(10001)}, 'local phone': {agent_phone: '0712345678'},
})) test(`rejects ${name}`, () => assert.throws(() => parseListing({...valid,...patch},owner)));
test('moderation requires reason, prior status, and rejects verification flag', () => {
 const v={id:owner,status:'approved',expected_status:'pending',reason:'Listing reviewed'};
 assert.equal(parseModeration(v).status,'approved');
 for(const patch of [{reason:''},{expected_status:undefined},{verified:true},{id:'bad'}]) assert.throws(()=>parseModeration({...v,...patch}));
});
