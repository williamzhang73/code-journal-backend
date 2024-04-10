import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { type Entry } from '../data';
import { readToken } from '../lib';

/**
 * Form that adds or edits an entry.
 * Gets `entryId` from route.
 * If `entryId` === 'new' then creates a new entry.
 * Otherwise reads the entry and edits it.
 */
export function EntryForm() {
  const { entryId } = useParams();
  const [entry, setEntry] = useState<Entry>();
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const isEditing = entryId && entryId !== 'new';

  useEffect(() => {
    async function load(id: number) {
      setIsLoading(true);
      try {
        const req = {
          method: 'GET',
          headers: { Authorization: `Bearer ${readToken()}` },
        };
        const response = await fetch(`/api/entries/${id}`, req);
        if (!response) throw new Error('Network response is not ok.');
        const result = await response.json();
        setEntry(result);
        setPhotoUrl(result.photoUrl);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (isEditing) load(+entryId);
  }, [entryId, isEditing]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newEntry = Object.fromEntries(formData) as unknown as Entry;
    if (isEditing) {
      const req = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      };

      const response = await fetch(`/api/entries/${entryId}`, req);
      if (!response) throw new Error('Network response is not ok.');
      const result = await response.json();
      console.log(`update successfully ${result.entryId}`);
      navigate('/');
    } else {
      const req = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${readToken()}`,
        },
        body: JSON.stringify(newEntry),
      };
      const response = await fetch('/api/entries', req);
      if (!response) throw new Error('Network response is not ok.');
      const result = await response.json();
      console.log('user: ', result);
      alert(`${result.entryId} added`);
      navigate('/');
    }
  }

  async function handleDelete() {
    if (!entry?.entryId) throw new Error('Should never happen');
    navigate('/');
    if (isDeleting) {
      const req = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      };
      const response = await fetch(`/api/entries/${entryId}`, req);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      alert(`${result.entryId} deleted`);
      console.log(result, 'deleted');
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        Error Loading Entry with ID {entryId}:{' '}
        {error instanceof Error ? error.message : 'Unknown Error'}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="column-full d-flex justify-between">
          <h1>{isEditing ? 'Edit Entry' : 'New Entry'}</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="row margin-bottom-1">
          <div className="column-half">
            <img
              className="input-b-radius form-image"
              src={photoUrl || '/images/placeholder-image-square.jpg'}
              alt="entry"
            />
          </div>
          <div className="column-half">
            <label className="margin-bottom-1 d-block">
              Title
              <input
                name="title"
                defaultValue={entry?.title ?? ''}
                required
                className="input-b-color text-padding input-b-radius purple-outline input-height margin-bottom-2 d-block width-100"
                type="text"
              />
            </label>
            <label className="margin-bottom-1 d-block">
              Photo URL
              <input
                name="photoUrl"
                defaultValue={entry?.photoUrl ?? ''}
                required
                className="input-b-color text-padding input-b-radius purple-outline input-height margin-bottom-2 d-block width-100"
                type="text"
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="row margin-bottom-1">
          <div className="column-full">
            <label className="margin-bottom-1 d-block">
              Notes
              <textarea
                name="notes"
                defaultValue={entry?.notes ?? ''}
                required
                className="input-b-color text-padding input-b-radius purple-outline d-block width-100"
                cols={30}
                rows={10}
              />
            </label>
          </div>
        </div>
        <div className="row">
          <div className="column-full d-flex justify-between">
            {isEditing && (
              <button
                className="delete-entry-button"
                type="button"
                onClick={() => setIsDeleting(true)}>
                Delete Entry
              </button>
            )}
            <button className="input-b-radius text-padding purple-background white-text">
              SAVE
            </button>
          </div>
        </div>
      </form>
      {isDeleting && (
        <div
          id="modalContainer"
          className="modal-container d-flex justify-center align-center">
          <div className="modal row">
            <div className="column-full d-flex justify-center">
              <p>Are you sure you want to delete this entry?</p>
            </div>
            <div className="column-full d-flex justify-between">
              <button
                className="modal-button"
                onClick={() => setIsDeleting(false)}>
                Cancel
              </button>
              <button
                className="modal-button red-background white-text"
                onClick={handleDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
