import { useState, useEffect } from 'react'
import './CollectionsList.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function CollectionsList({ user, onBack, onSelectCollection, language, onShowSubscriptions }) {
  const [collections, setCollections] = useState([])
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDesc, setNewCollectionDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const translations = {
    it: {
      title: 'Le Mie Collezioni',
      backToMain: '← Torna alla Ricerca Mazzi',
      createNew: '+ Nuova Collezione',
      noCollections: 'Nessuna collezione',
      noCollectionsDesc: 'Crea la tua prima collezione per organizzare le tue carte',
      cards: 'carte',
      uniqueCards: 'carte uniche',
      createdOn: 'Creata il',
      viewCollection: 'Visualizza',
      deleteCollection: 'Elimina',
      modalTitle: 'Crea Nuova Collezione',
      collectionName: 'Nome Collezione',
      collectionDesc: 'Descrizione (opzionale)',
      cancel: 'Annulla',
      create: 'Crea',
      creating: 'Creazione...',
      namePlaceholder: 'Es: Mazzo Rosso, Collezione Standard...',
      descPlaceholder: 'Descrizione della collezione...',
      limitReached: 'Limite collezioni raggiunto',
      limitReachedDesc: 'Hai raggiunto il limite di',
      collectionsForPlan: 'collezioni per il tuo piano',
      upgradeToCreate: 'Aggiorna il tuo piano per creare più collezioni',
      collectionsRemaining: 'collezioni rimanenti'
    },
    en: {
      title: 'My Collections',
      backToMain: '← Back to Deck Search',
      createNew: '+ New Collection',
      noCollections: 'No collections',
      noCollectionsDesc: 'Create your first collection to organize your cards',
      cards: 'cards',
      uniqueCards: 'unique cards',
      createdOn: 'Created on',
      viewCollection: 'View',
      deleteCollection: 'Delete',
      modalTitle: 'Create New Collection',
      collectionName: 'Collection Name',
      collectionDesc: 'Description (optional)',
      cancel: 'Cancel',
      create: 'Create',
      creating: 'Creating...',
      namePlaceholder: 'E.g: Red Deck, Standard Collection...',
      descPlaceholder: 'Collection description...',
      limitReached: 'Collection limit reached',
      limitReachedDesc: 'You have reached the limit of',
      collectionsForPlan: 'collections for your plan',
      upgradeToCreate: 'Upgrade your plan to create more collections',
      collectionsRemaining: 'collections remaining'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setCollections(data.collections)
      setSubscriptionInfo(data.subscription)
    } catch (err) {
      console.error('Error loading collections:', err)
    }
    setLoading(false)
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    // Check if can create more
    if (subscriptionInfo && !subscriptionInfo.can_create_more) {
      alert(
        `${t.limitReachedDesc} ${subscriptionInfo.collection_limit} ${t.collectionsForPlan}. ${t.upgradeToCreate}`
      )
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/collections/create?user_id=${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc || null
        })
      })

      if (res.ok) {
        const newCollection = await res.json()
        setShowCreateModal(false)
        setNewCollectionName('')
        setNewCollectionDesc('')
        
        // Open the newly created collection
        onSelectCollection({
          id: newCollection.id,
          name: newCollection.name,
          description: newCollection.description,
          card_count: 0,
          total_cards: 0,
          created_at: newCollection.created_at
        })
      } else {
        const data = await res.json()
        alert(data.detail || 'Error creating collection')
      }
    } catch (err) {
      console.error('Error creating collection:', err)
      alert('Error creating collection')
    }
    setCreating(false)
  }

  const handleDeleteCollection = async (collectionId, collectionName) => {
    if (!confirm(`${language === 'it' ? 'Eliminare' : 'Delete'} "${collectionName}"?`)) return

    try {
      const res = await fetch(`${API_URL}/api/collections/${collectionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadCollections()
      }
    } catch (err) {
      console.error('Error deleting collection:', err)
    }
  }

  return (
    <div className="collections-list-page">
      <header className="collections-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            {t.backToMain}
          </button>
          <div className="header-actions">
            <span className="user-email">{user.email}</span>
            <button className="subscription-btn-small" onClick={onShowSubscriptions}>
              💎
            </button>
          </div>
        </div>
        <div className="header-title-row">
          <h1>{t.title}</h1>
          <button 
            className="create-collection-btn" 
            onClick={() => setShowCreateModal(true)}
            disabled={subscriptionInfo && !subscriptionInfo.can_create_more}
          >
            {t.createNew}
          </button>
        </div>
      </header>

      <main className="collections-main">
        {subscriptionInfo && subscriptionInfo.remaining !== null && subscriptionInfo.remaining <= 2 && subscriptionInfo.remaining > 0 && (
          <div className="collections-warning">
            ⚠️ {t.collectionsRemaining}: {subscriptionInfo.remaining}
            <button className="upgrade-btn-inline" onClick={onShowSubscriptions}>
              {language === 'it' ? 'Aggiorna Piano' : 'Upgrade Plan'}
            </button>
          </div>
        )}

        {subscriptionInfo && !subscriptionInfo.can_create_more && (
          <div className="collections-limit-reached">
            {t.limitReached}: {subscriptionInfo.collection_limit} {t.collectionsForPlan}
            <button className="upgrade-btn-inline" onClick={onShowSubscriptions}>
              {language === 'it' ? 'Aggiorna Piano' : 'Upgrade Plan'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="no-collections">
            <div className="empty-icon">📚</div>
            <h3>{t.noCollections}</h3>
            <p>{t.noCollectionsDesc}</p>
            <button className="create-first-btn" onClick={() => setShowCreateModal(true)}>
              {t.createNew}
            </button>
          </div>
        ) : (
          <div className="collections-grid">
            {collections.map((collection) => (
              <div key={collection.id} className="collection-card">
                <div className="collection-header">
                  <h3>{collection.name}</h3>
                  {collection.description && (
                    <p className="collection-desc">{collection.description}</p>
                  )}
                </div>
                <div className="collection-stats">
                  <div className="stat">
                    <span className="stat-value">{collection.card_count}</span>
                    <span className="stat-label">{t.uniqueCards}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{collection.total_cards}</span>
                    <span className="stat-label">{t.cards}</span>
                  </div>
                </div>
                <div className="collection-date">
                  {t.createdOn} {new Date(collection.created_at).toLocaleDateString()}
                </div>
                <div className="collection-actions">
                  <button 
                    className="view-btn"
                    onClick={() => onSelectCollection(collection)}
                  >
                    {t.viewCollection}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteCollection(collection.id, collection.name)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content create-collection-modal">
            <h2>{t.modalTitle}</h2>
            <div className="form-group">
              <label>{t.collectionName}</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t.namePlaceholder}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>{t.collectionDesc}</label>
              <textarea
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder={t.descPlaceholder}
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewCollectionName('')
                  setNewCollectionDesc('')
                }}
              >
                {t.cancel}
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || creating}
              >
                {creating ? t.creating : t.create}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="collections-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default CollectionsList
