import assert from "node:assert/strict";
import test from "node:test";
import {
  detectAvatarMimeType,
  getOwnedAvatarStoragePath,
  MAX_AVATAR_SIZE_BYTES,
  normalizeUsername,
  normalizeWhatsappNumber,
  validateAvatarImage,
} from "@/lib/user-settings";

test("WhatsApp settings normalize Indonesian local numbers to digits-only international form", () => {
  assert.equal(normalizeWhatsappNumber("62", "0812 3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("62", "+62 (812) 3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("62", ""), null);
  assert.throws(() => normalizeWhatsappNumber("62", "+60 12345678"), /Kode negara/);
});

test("editable usernames are trimmed, lowercase, and restricted to unique-key-safe characters", () => {
  assert.equal(normalizeUsername("  Player_One  "), "player_one");
  assert.throws(() => normalizeUsername("ab"), /3–30/);
  assert.throws(() => normalizeUsername("bad-name"), /3–30/);
});

test("avatar uploads require supported image signatures and stay within 2 MB", () => {
  assert.equal(detectAvatarMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
  assert.equal(detectAvatarMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectAvatarMimeType(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])), "image/webp");
  assert.throws(() => validateAvatarImage(Uint8Array.from([0x00, 0x01])), /JPEG, PNG, atau WebP/);
  assert.throws(() => validateAvatarImage(new Uint8Array(MAX_AVATAR_SIZE_BYTES + 1).fill(0xff)), /maksimal 2 MB/);
});

test("avatar cleanup only accepts URLs owned by this user in the public avatars bucket", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example";
  try {
    assert.equal(getOwnedAvatarStoragePath("https://project.example/storage/v1/object/public/avatars/user-1/photo.webp", "user-1"), "user-1/photo.webp");
    assert.equal(getOwnedAvatarStoragePath("https://project.example/storage/v1/object/public/avatars/user-2/photo.webp", "user-1"), null);
    assert.equal(getOwnedAvatarStoragePath("https://other.example/storage/v1/object/public/avatars/user-1/photo.webp", "user-1"), null);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
});
