import { useState, useEffect } from "react";
import { UserFollow } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function FollowButton({ targetEmail, targetId, targetName, targetPhotoUrl, size = "sm", variant = "outline" }) {
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFollowStatus();
  }, [targetEmail]);

  const loadFollowStatus = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.email === targetEmail) return;

      const follows = await UserFollow.filter({
        follower_email: userData.email,
        following_email: targetEmail
      });

      if (follows.length > 0) {
        setIsFollowing(true);
        setFollowId(follows[0].id);
      }
    } catch (error) {
      console.error("Erro ao verificar status de seguir:", error);
    }
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        await UserFollow.delete(followId);
        setIsFollowing(false);
        setFollowId(null);
        toast.success(`Você deixou de seguir ${targetName}`);
      } else {
        const newFollow = await UserFollow.create({
          follower_email: user.email,
          following_email: targetEmail,
          following_name: targetName,
          following_photo_url: targetPhotoUrl
        });
        setIsFollowing(true);
        setFollowId(newFollow.id);
        toast.success(`Você agora está seguindo ${targetName}`);

        await base44.functions.invoke("sendAppNotification", {
          targetEmail: targetEmail,
          title: "Novo seguidor",
          message: `${user.full_name} começou a seguir você`,
          type: "follow",
          actionUrl: createPageUrl("UserProfile") + "?email=" + encodeURIComponent(user.email),
          relatedUserName: user.full_name,
          relatedUserPhoto: user.profile_photo_url
        });
      }
    } catch (error) {
      toast.error("Erro ao processar ação");
    }
    setIsLoading(false);
  };

  if (!user || user.email === targetEmail) return null;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleFollow}
      disabled={isLoading}
      className={
        isFollowing 
          ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600" 
          : "bg-white hover:bg-gray-100 text-gray-900 border-gray-300 shadow-sm"
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Seguir
        </>
      )}
    </Button>
  );
}