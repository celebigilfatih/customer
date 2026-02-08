"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { noteCreateSchema, NoteCreate } from "@/lib/validations"
import { CustomerWithNotes } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Save, X, FileText, Clock, MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

interface CustomerNotesProps {
  customer: CustomerWithNotes
  onNotesUpdate?: () => void
}

export function CustomerNotes({ customer, onNotesUpdate }: CustomerNotesProps) {
  const [notes, setNotes] = useState(customer.notes || [])
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<NoteCreate>({
    resolver: zodResolver(noteCreateSchema),
    defaultValues: {
      customerId: customer.id,
      content: ""
    }
  })

  const [editForm, setEditForm] = useState("")

  const handleAddNote = async (data: NoteCreate) => {
    setLoading(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Not eklenirken hata oluştu')
      }

      const newNote = await response.json()
      setNotes([...notes, newNote])
      form.reset({ customerId: customer.id, content: "" })
      setIsAddingNote(false)
      toast.success("Not başarıyla eklendi")
      onNotesUpdate?.()
    } catch {
      toast.error("Not eklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const handleEditNote = async (noteId: string, content: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error('Not güncellenirken hata oluştu')
      }

      const updatedNote = await response.json()
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note))
      setEditingNoteId(null)
      setEditForm("")
      toast.success("Not başarıyla güncellendi")
      onNotesUpdate?.()
    } catch {
      toast.error("Not güncellenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Not silinirken hata oluştu')
      }

      setNotes(notes.filter(note => note.id !== noteId))
      toast.success("Not başarıyla silindi")
      onNotesUpdate?.()
    } catch {
      toast.error("Not silinirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (note: { id: string; content: string }) => {
    setEditingNoteId(note.id)
    setEditForm(note.content)
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setEditForm("")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Müşteri Notları</CardTitle>
              <CardDescription>Müşteri hakkında notlar ve hatırlatmalar</CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setIsAddingNote(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Yeni Not
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add New Note Form */}
        {isAddingNote && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddNote)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni Not</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notunuzu buraya yazın..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNote(false)
                        form.reset({ customerId: customer.id, content: "" })
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      İptal
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Henüz not eklenmemiş"
            description="Müşteri hakkında önemli bilgileri kaydetmek için not ekleyin."
            action={
              <Button onClick={() => setIsAddingNote(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                İlk Notu Ekle
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editForm}
                        onChange={(e) => setEditForm(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditNote(note.id, editForm)}
                          disabled={loading || !editForm.trim()}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Kaydet
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => startEdit(note)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteNote(note.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
