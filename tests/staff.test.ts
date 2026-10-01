import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveStaff } from '../lib/auth/staff.ts';

function mock(claims: unknown, rows: unknown, membershipError: unknown = null) {
  let queried = false;
  const client = {
    auth: { getClaims: async (): Promise<{ data: unknown; error: Error | null }> => ({ data: claims, error: null }) },
    from: (table: string) => {
      assert.equal(table, 'memberships');
      queried = true;
      return { select: (columns: string) => {
        assert.equal(columns, 'organization_id');
        return { eq: (field: string, id: string) => {
          assert.equal(field, 'user_id');
          assert.equal(id, 'staff-id');
          return { limit: async () => ({ data: rows, error: membershipError }) };
        } };
      } };
    },
  };
  return { client, wasQueried: () => queried };
}

test('missing verified claims denies without querying memberships', async () => {
  const { client, wasQueried } = mock(null, [{ organization_id: 'org-id' }]);
  assert.equal(await resolveStaff(client as never), null);
  assert.equal(wasQueried(), false);
});

test('claims verification error denies even with a subject', async () => {
  const { client, wasQueried } = mock({ claims: { sub: 'staff-id' } }, [{ organization_id: 'org-id' }]);
  client.auth.getClaims = async () => ({ data: { claims: { sub: 'staff-id' } }, error: new Error('invalid signature') });
  assert.equal(await resolveStaff(client as never), null);
  assert.equal(wasQueried(), false);
});

test('no membership denies', async () => {
  assert.equal(await resolveStaff(mock({ claims: { sub: 'staff-id' } }, []).client as never), null);
});

test('membership query error denies even when rows exist', async () => {
  assert.equal(await resolveStaff(mock({ claims: { sub: 'staff-id' } }, [{ organization_id: 'org-id' }], new Error('database unavailable')).client as never), null);
});

test('verified member receives organization scope', async () => {
  assert.deepEqual(await resolveStaff(mock({ claims: { sub: 'staff-id' } }, [{ organization_id: 'org-id' }]).client as never), { userId: 'staff-id', organizationId: 'org-id' });
});
