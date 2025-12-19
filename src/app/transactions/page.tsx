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
import { Edit, Trash2, Loader2, ArrowUpRight } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { UserComboBox } from "@/components/apps-components/userComboBox";
import { Transaction, User } from "../../../prisma/generated/prisma/client";
import { toast } from "sonner";

const monthOptions = [
  { value: "1", name: "1 MONTH", id: "1" },
  { value: "2", name: "2 MONTHS", id: "2" },
  { value: "3", name: "3 MONTHS", id: "3" },
  { value: "4", name: "4 MONTHS", id: "4" },
];

const UserForm = ({
  userName,
  setUserName,
  passCode,
  setPassCode,
  handleSubmit,
  editingId,
}: {
  userName: string;
  setUserName: (value: string) => void;
  passCode: string;
  setPassCode: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  editingId: string | null;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          value={userName}
          onChange={(e) => setUserName(e.target.value || "")}
          required
        />
      </div>
      <div>
        <Label htmlFor="passcode">Passcode</Label>
        <Input
          value={passCode}
          onChange={(e) => setPassCode(e.target.value || "")}
          required
        />
      </div>
    </div>
    <Button onClick={handleSubmit} className="w-full">
      {editingId ? "Update User" : "Create User"}
    </Button>
  </div>
);

const TransactionForm = ({
  selectedUser,
  setSelectedUser,
  profileType,
  setProfileType,
  profileName,
  setProfileName,
  amount,
  setAmount,
  assignedRooms,
  setAssignedRooms,
  selectedMonths,
  setSelectedMonths,
  users,
  handleSubmit,
  editingId,
}: {
  selectedUser: string;
  setSelectedUser: (value: string) => void;
  profileType: string;
  setProfileType: (value: string) => void;
  profileName: string;
  setProfileName: (value: string) => void;
  amount: number;
  setAmount: (value: number) => void;
  assignedRooms: number;
  setAssignedRooms: (value: number) => void;
  users: { id: string; name: string; value: string }[] | [];
  handleSubmit: (e: React.FormEvent) => void;
  editingId: string | null;
  setEditingId?: (id: string | null) => void;
  setSelectedMonths: (value: string) => void;
  selectedMonths: string;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="userId">User ID</Label>
        <UserComboBox
          options={users || []}
          handleSelect={setSelectedUser}
          value={selectedUser}
        />
      </div>
      <div>
        <Label htmlFor="profileType">Profile Type</Label>
        <Input
          id="profileType"
          name="profileType"
          value={profileType}
          onChange={(e) => setProfileType(e.target.value || "")}
          required
        />
      </div>
      <div>
        <Label htmlFor="profileName">Profile Name</Label>
        <Input
          id="profileName"
          name="profileName"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value || "")}
          required
        />
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || ""))}
          required
        />
      </div>
      <div>
        <Label htmlFor="assignedRooms">Assigned Rooms</Label>
        <Input
          id="assignedRooms"
          name="assignedRooms"
          type="number"
          value={assignedRooms}
          onChange={(e) => setAssignedRooms(parseInt(e.target.value || ""))}
          required
        />
      </div>

      <div>
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <UserComboBox
          options={monthOptions}
          handleSelect={setSelectedMonths}
          value={selectedMonths}
        />
      </div>
    </div>
    <Button onClick={handleSubmit} className="w-full">
      {editingId ? "Update Transaction" : "Create Transaction"}
    </Button>
  </div>
);

export default function TransactionPage() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.auth.getCurrentUser.queryOptions()
  );

  const { data: roomsOpen } = useQuery(
    trpc.games.checkForOpenRooms.queryOptions()
  );

  const { data: users } = useQuery(trpc.auth.getUsers.queryOptions());
  const { data: usersDetails, refetch: refetchUsers } = useQuery(
    trpc.auth.getUsersDetails.queryOptions()
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  // tRPC queries and mutations
  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQuery(trpc.transaction.getManyTransactions.queryOptions());

  const closeTwoHourLongRooms = useMutation(
    trpc.games.closeOpenRooms.mutationOptions({
      onSuccess: () => {
        toast.success("Rooms closed successfully!");
      },
    })
  );

  const createMutation = useMutation(
    trpc.transaction.createTransaction.mutationOptions({
      onSuccess: () => {
        refetch();
        resetForm();
        toast.success("Transaction created successfully!");
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
        toast.success("Transaction updated successfully!");
      },
    })
  );

  const createUserMutation = useMutation(
    trpc.auth.createUser.mutationOptions({
      onSuccess: () => {
        resetFormUser();
        refetchUsers();
        toast.success("User created successfully!");
      },
    })
  );

  const editUserMutation = useMutation(
    trpc.auth.updateUser.mutationOptions({
      onSuccess: () => {
        setIsUserDialogOpen(false);
        setUserEditingId(null);
        resetFormUser();
        refetchUsers();
        toast.success("User updated successfully!");
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
    setEditingId(null);
    setSelectedUser(users ? users[0].id : "");
    setProfileType("");
    setProfileName("");
    setAmount(0);
    setAssignedRooms(0);
    setExpiryDate(undefined);
  };

  const resetFormUser = () => {
    setUserEditingId(null);
    setUserName("");
    setPassCode("");
  };

  const ReturnDateAfterMonths = (months: number) => {
    const now = new Date();
    const expiryDate = new Date(
      now.getFullYear(),
      now.getMonth() + months,
      now.getDate()
    );
    return expiryDate;
  };

  const handleCloseOpenRooms = () => {
    if (roomsOpen) {
      closeTwoHourLongRooms.mutate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      editMutation.mutate({
        id: editingId,
        userId: selectedUser,
        profileType: profileType,
        profileName: profileName,
        amount: amount,
        assignedRooms: assignedRooms,
        expiryDate: expiryDate,
      });
    } else {
      createMutation.mutate({
        userId: selectedUser,
        profileType: profileType,
        profileName: profileName,
        amount: amount,
        assignedRooms: assignedRooms,
        expiryDate: ReturnDateAfterMonths(Number(selectedMonths)) || "",
      });
    }
  };

  const handleRedirect = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedUser(transaction.userId);
    setProfileType(transaction.profileType);
    setProfileName(transaction.profileName);
    setAmount(transaction.amount);
    setAssignedRooms(transaction.assignedRooms);
    setExpiryDate(new Date(transaction.expiryDate));
    setEditingId(transaction.id);
    setIsDialogOpen(true);
  };

  const handleUserEdit = (name: string, id: string, passCode: string) => {
    setUserName(name);
    setPassCode(passCode);

    setUserEditingId(id);
    setIsUserDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate({ id });
    }
  };

  const [selectedUser, setSelectedUser] = useState(users ? users[0].id : "");
  const [profileType, setProfileType] = useState("");
  const [profileName, setProfileName] = useState("");
  const [amount, setAmount] = useState(0);
  const [assignedRooms, setAssignedRooms] = useState(0);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [selectedMonths, setSelectedMonths] = useState<string>("1");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  const [userName, setUserName] = useState<string>("");
  const [passCode, setPassCode] = useState<string>("");
  const [userEditingId, setUserEditingId] = useState<string | null>(null);

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (userEditingId) {
      editUserMutation.mutate({
        id: userEditingId,
        username: userName,
        passcode: passCode,
      });
    } else {
      createUserMutation.mutate({
        username: userName,
        passcode: passCode,
      });
    }
  };

  React.useEffect(() => {
    if (!userLoading) {
      if (
        currentUser === null ||
        currentUser === undefined ||
        currentUser.isAdmin === false
      ) {
        router.push("/login");
      }
    }
  }, [currentUser, userLoading, router]);

  const usersName = React.useCallback(
    (userID: string) => {
      const user = users?.find((user) => user.id === userID);
      return user ? user.name : "Unknown User";
    },
    [users]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Transaction Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => setShowTransactionForm((prev) => !prev)}>
                  {showTransactionForm
                    ? "Hide Transaction Form"
                    : "Show Transaction Form"}
                </Button>
                <Button onClick={() => setShowUserForm((prev) => !prev)}>
                  {showUserForm ? "Hide User Form" : "Show User Form"}
                </Button>
                {roomsOpen && roomsOpen?.length > 0 && (
                  <Button onClick={handleCloseOpenRooms}>
                    Close Open Rooms({roomsOpen?.length})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {showUserForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm
                userName={userName}
                setUserName={setUserName}
                passCode={passCode}
                setPassCode={setPassCode}
                handleSubmit={handleSubmitUser}
                editingId={userEditingId}
              />
            </CardContent>
          </Card>
        )}

        {showTransactionForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm
                users={users || []}
                handleSubmit={handleSubmit}
                editingId={editingId}
                setEditingId={setEditingId}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                profileType={profileType}
                setProfileType={setProfileType}
                profileName={profileName}
                setProfileName={setProfileName}
                amount={amount}
                setAmount={setAmount}
                assignedRooms={assignedRooms}
                setAssignedRooms={setAssignedRooms}
                setSelectedMonths={setSelectedMonths}
                selectedMonths={selectedMonths}
              />
            </CardContent>
          </Card>
        )}

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
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Profile Type</th>
                        <th className="text-left p-2">Profile Name</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Used/Remain</th>
                        <th className="text-left p-2">Expiry Date</th>
                        <th className="text-left p-2">Created</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="p-2 font-mono text-sm">
                            {usersName(transaction.userId)}
                          </td>
                          <td className="p-2">{transaction.profileType}</td>
                          <td className="p-2">{transaction.profileName}</td>
                          <td className="p-2">
                            {transaction.amount.toLocaleString()} sh
                          </td>
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
                                onClick={() =>
                                  handleRedirect(transaction.userId)
                                }
                                //   disabled={deleteMutation.isLoading}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
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
                            <span className="font-semibold">User:</span>
                            <span>{usersName(transaction.userId)}</span>
                          </div>
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
                              onClick={() => handleRedirect(transaction.userId)}
                              // disabled={deleteMutation.isLoading}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                              Go
                            </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Users ({users?.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {usersDetails?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No Users yet
              </p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Username</th>
                        <th className="text-left p-2">Passcode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersDetails?.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-2">{user.name}</td>
                          <td className="p-2">{user.passcode}</td>

                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUserEdit(
                                    user.name,
                                    user.id,
                                    user.passcode
                                  )
                                }
                                //   disabled={deleteMutation.isLoading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {usersDetails?.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Username:</span>
                            <span>{user.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Passcode:</span>
                            <span>{user.passcode}</span>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                handleUserEdit(
                                  user.name,
                                  user.id,
                                  user.passcode
                                )
                              }
                              // disabled={deleteMutation.isLoading}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
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
            <TransactionForm
              users={users || []}
              handleSubmit={handleSubmit}
              editingId={editingId}
              setEditingId={setEditingId}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              profileType={profileType}
              setProfileType={setProfileType}
              profileName={profileName}
              setProfileName={setProfileName}
              amount={amount}
              setAmount={setAmount}
              assignedRooms={assignedRooms}
              setAssignedRooms={setAssignedRooms}
              setSelectedMonths={setSelectedMonths}
              selectedMonths={selectedMonths}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <UserForm
              userName={userName}
              setUserName={setUserName}
              passCode={passCode}
              setPassCode={setPassCode}
              handleSubmit={handleSubmitUser}
              editingId={userEditingId}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
