import { useState, useEffect } from 'react'
import './CollectionsList.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function CollectionsList({ user, onBack, onSelectCollection, onSelectDeck, language, onShowSubscriptions, onLimitError }) {
  const [collections, setCollections] = useState([])
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDesc, setNewCollectionDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState(null)
  const [linkedDecks, setLinkedDecks] = useState([])
  const [loadingLinkedDecks, setLoadingLinkedDecks] = useState(false)

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
      updatedOn: 'Modificata il',
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
      limitReached: 'Token insufficienti',
      limitReachedDesc: 'Non hai abbastanza token per creare una nuova collezione.',
      buyTokens: 'Acquista Token',
      deleteModalTitle: 'Elimina Collezione',
      deleteModalMessage: 'Sei sicuro di voler eliminare questa collezione?',
      deleteModalWarning: 'Questa azione eliminerà tutte le carte contenute e non può essere annullata.',
      linkedDecksWarning: 'Attenzione: Questa collezione è collegata a',
      linkedDecksSingular: 'mazzo salvato',
      linkedDecksPlural: 'mazzi salvati',
      linkedDecksWillBeDeleted: 'che verranno eliminati insieme alla collezione:',
      confirmDelete: 'Sì, Elimina',
      cancelDelete: 'Annulla',
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
      updatedOn: 'Updated on',
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
      limitReached: 'Insufficient tokens',
      limitReachedDesc: 'You don\'t have enough tokens to create a new collection.',
      buyTokens: 'Buy Tokens',
      deleteModalTitle: 'Delete Collection',
      deleteModalMessage: 'Are you sure you want to delete this collection?',
      deleteModalWarning: 'This action will delete all contained cards and cannot be undone.',
      linkedDecksWarning: 'Warning: This collection is linked to',
      linkedDecksSingular: 'saved deck',
      linkedDecksPlural: 'saved decks',
      linkedDecksWillBeDeleted: 'that will be deleted along with the collection:',
      confirmDelete: 'Yes, Delete',
      cancelDelete: 'Cancel',
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

    // Check if can create more (token-based)
    if (subscriptionInfo && !subscriptionInfo.can_create_more) {
      alert(t.limitReachedDesc)
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
      } else if (res.status === 403 && onLimitError) {
        const data = await res.json()
        onLimitError(data.detail)
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

  const openDeleteModal = async (collection) => {
    setCollectionToDelete(collection)
    setLoadingLinkedDecks(true)
    setShowDeleteModal(true)
    
    // Carica i mazzi collegati a questa collezione
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/by-collection/${collection.id}`)
      const data = await res.json()
      setLinkedDecks(data.decks || [])
    } catch (err) {
      console.error('Error loading linked decks:', err)
      setLinkedDecks([])
    }
    setLoadingLinkedDecks(false)
  }

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return

    try {
      const res = await fetch(`${API_URL}/api/collections/${collectionToDelete.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setShowDeleteModal(false)
        setCollectionToDelete(null)
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
              🪙
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
        {subscriptionInfo && !subscriptionInfo.can_create_more && (
          <div className="collections-limit-reached">
            {t.limitReachedDesc}
            <button className="upgrade-btn-inline" onClick={onShowSubscriptions}>
              🪙 {t.buyTokens}
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
                  {collection.linked_decks && collection.linked_decks.length > 0 && (
                    <div className="clist-linked-decks">
                      <span className="clist-decks-label">{language === 'it' ? 'Mazzi:' : 'Decks:'}</span>
                      {collection.linked_decks.map(deck => (
                        <button
                          key={deck.id}
                          className="clist-deck-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectDeck && onSelectDeck(deck)
                          }}
                        >
                          {deck.name}
                        </button>
                      ))}
                    </div>
                  )}
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
                  <div className="collection-dates">
                    <span>{t.createdOn} {new Date(collection.created_at).toLocaleDateString()}</span>
                    {collection.updated_at && collection.updated_at !== collection.created_at && (
                      <span>{t.updatedOn} {new Date(collection.updated_at).toLocaleDateString()}</span>
                    )}
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
                      onClick={() => openDeleteModal(collection)}
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

      {showDeleteModal && collectionToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-collection-modal">
            <h2>{t.deleteModalTitle}</h2>
            <div className="delete-modal-content">
              <div className="warning-icon-large">⚠️</div>
              <p className="delete-message">{t.deleteModalMessage}</p>
              <div className="collection-to-delete">
                <strong>{collectionToDelete.name}</strong>
                <span className="collection-stats">
                  {collectionToDelete.card_count} {language === 'it' ? 'carte uniche' : 'unique cards'} • {collectionToDelete.total_cards} {language === 'it' ? 'carte totali' : 'total cards'}
                </span>
              </div>
              
              {loadingLinkedDecks ? (
                <div className="linked-decks-loading">
                  <div className="spinner"></div>
                  <p>{language === 'it' ? 'Controllo mazzi collegati...' : 'Checking linked decks...'}</p>
                </div>
              ) : linkedDecks.length > 0 && (
                <div className="linked-decks-warning">
                  <p className="linked-decks-title">
                    {t.linkedDecksWarning} <strong>{linkedDecks.length}</strong> {linkedDecks.length === 1 ? t.linkedDecksSingular : t.linkedDecksPlural} {t.linkedDecksWillBeDeleted}
                  </p>
                  <ul className="linked-decks-list">
                    {linkedDecks.map(deck => (
                      <li key={deck.id}>
                        <span className="deck-name">{deck.name}</span>
                        <span className="deck-info">({deck.total_cards} {language === 'it' ? 'carte' : 'cards'} • {deck.completion_percentage}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="delete-warning">{t.deleteModalWarning}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setCollectionToDelete(null)
                  setLinkedDecks([])
                }}
              >
                {t.cancelDelete}
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteCollection}
              >
                {t.confirmDelete}
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
