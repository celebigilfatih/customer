"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { noteCreateSchema, NoteCreate } from "@/lib/validations"
import { CustomerWithNotes } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { apiPost, apiPut, apiDelete } from "@/lib/api"

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
      const response = await apiPost('/api/notes', data)

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
      const response = await apiPut(`/api/notes/${noteId}`, { content })

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
      const response = await apiDelete(`/api/notes/${noteId}`)

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
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="bg-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            📝 Müşteri Notları
          </CardTitle>
          <Button
            onClick={() => setIsAddingNote(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Yeni Not
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Add New Note Form */}
        {isAddingNote && (
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddNote)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Yeni Not</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notunuzu buraya yazın..."
                            className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      className="bg-green-600 hover:bg-green-700"
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
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-gray-600">Henüz not eklenmemiş</p>
            <p className="text-sm text-gray-500 mt-1">Yukarıdaki &quot;Yeni Not&quot; butonuna tıklayarak ilk notunuzu ekleyin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="border border-gray-200 hover:bg-gray-50">
                <CardContent className="p-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editForm}
                        onChange={(e) => setEditForm(e.target.value)}
                        className="min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditNote(note.id, editForm)}
                          disabled={loading || !editForm.trim()}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
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
                        <div className="text-sm text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => startEdit(note)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteNote(note.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
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