"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";

export default function TransactionPage() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.auth.getCurrentUser.queryOptions()
  );

  const [formData, setFormData] = useState({
    userId: "",
    profileType: "",
    profileName: "",
    amount: "",
    assignedRooms: "",
    usedRooms: "",
    expiryDate: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // tRPC queries and mutations
  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQuery(trpc.transaction.getManyTransactions.queryOptions());
  const createMutation = useMutation(
    trpc.transaction.createTransaction.mutationOptions({
      onSuccess: () => {
        refetch();
        resetForm();
      },
    })
  );
  const editMutation = useMutation(
    trpc.transaction.editTransaction.mutationOptions({
      onSuccess: () => {
        refetch();
        setIsDialogOpen(false);
        setEditingId(null);
        resetForm();
      },
    })
  );
  const deleteMutation = useMutation(
    trpc.transaction.deleteTransaction.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    })
  );

  const transactions = transactionsData?.transactions || [];

  const resetForm = () => {
    setFormData({
      userId: "",
      profileType: "",
      profileName: "",
      amount: "",
      assignedRooms: "",
      usedRooms: "",
      expiryDate: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      editMutation.mutate({
        id: editingId,
        userId: formData.userId,
        profileType: formData.profileType,
        profileName: formData.profileName,
        amount: parseInt(formData.amount),
        assignedRooms: parseInt(formData.assignedRooms),
        usedRooms: formData.usedRooms,
        expiryDate: formData.expiryDate,
      });
    } else {
      createMutation.mutate({
        userId: formData.userId,
        profileType: formData.profileType,
        profileName: formData.profileName,
        amount: parseInt(formData.amount),
        assignedRooms: parseInt(formData.assignedRooms),
        usedRooms: formData.usedRooms,
        expiryDate: formData.expiryDate,
      });
    }
  };

  const handleEdit = (transaction: any) => {
    setFormData({
      userId: transaction.userId,
      profileType: transaction.profileType,
      profileName: transaction.profileName,
      amount: transaction.amount.toString(),
      assignedRooms: transaction.assignedRooms.toString(),
      usedRooms: transaction.usedRooms,
      expiryDate: new Date(transaction.expiryDate).toISOString().split("T")[0],
    });
    setEditingId(transaction.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate({ id });
    }
  };

  const TransactionForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="profileType">Profile Type</Label>
          <Input
            id="profileType"
            name="profileType"
            value={formData.profileType}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="profileName">Profile Name</Label>
          <Input
            id="profileName"
            name="profileName"
            value={formData.profileName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="assignedRooms">Assigned Rooms</Label>
          <Input
            id="assignedRooms"
            name="assignedRooms"
            type="number"
            value={formData.assignedRooms}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="usedRooms">Used Rooms</Label>
          <Input
            id="usedRooms"
            name="usedRooms"
            value={formData.usedRooms}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <Button
        onClick={handleSubmit}
        className="w-full"
        // disabled={createMutation.isLoading || editMutation.isLoading}
      >
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editingId ? "Update Transaction" : "Create Transaction"}
      </Button>
    </div>
  );

  React.useEffect(() => {
    if (!userLoading) {
      if (
        currentUser === null ||
        currentUser === undefined ||
        currentUser.username !== "myk"
      ) {
        router.push("/login");
      }
    }
  }, [currentUser, userLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Loading />;
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Transaction Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>Create New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions List ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User ID</th>
                        <th className="text-left p-2">Profile Type</th>
                        <th className="text-left p-2">Profile Name</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Rooms</th>
                        <th className="text-left p-2">Expiry Date</th>
                        <th className="text-left p-2">Created</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="p-2 font-mono text-sm">
                            {transaction.userId}
                          </td>
                          <td className="p-2">{transaction.profileType}</td>
                          <td className="p-2">{transaction.profileName}</td>
                          <td className="p-2">${transaction.amount}</td>
                          <td className="p-2">
                            {transaction.usedRooms}/{transaction.assignedRooms}
                          </td>
                          <td className="p-2">
                            {new Date(
                              transaction.expiryDate
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            {new Date(
                              transaction.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(transaction)}
                                //   disabled={deleteMutation.isLoading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(transaction.id)}
                                //   disabled={deleteMutation.isLoading}
                              >
                                {false ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Profile Name:</span>
                            <span>{transaction.profileName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Profile Type:</span>
                            <span>{transaction.profileType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Amount:</span>
                            <span>${transaction.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Rooms:</span>
                            <span>
                              {transaction.usedRooms}/
                              {transaction.assignedRooms}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Expiry:</span>
                            <span>
                              {new Date(
                                transaction.expiryDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Created:</span>
                            <span>
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(transaction)}
                              // disabled={deleteMutation.isLoading}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDelete(transaction.id)}
                              // disabled={deleteMutation.isLoading}
                            >
                              {false ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
